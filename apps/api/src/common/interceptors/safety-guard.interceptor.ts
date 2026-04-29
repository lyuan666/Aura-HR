import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * SafetyGuardInterceptor - 防止循环引用导致的内存爆炸
 * 在响应发送前对数据进行深度检查和“脱水”处理。
 */
@Injectable()
export class SafetyGuardInterceptor implements NestInterceptor {
  private readonly MAX_DEPTH = 10;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        try {
          return this.sanitize(data);
        } catch (error) {
          console.error(' [SafetyGuard] 检测到潜在的循环引用或深度递归:', error.message);
          throw new InternalServerErrorException('响应数据处理异常：检测到循环引用');
        }
      }),
    );
  }

  private sanitize(obj: any, depth = 0, visited = new WeakSet()): any {
    // 基础类型直接返回
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // 熔断 1: 深度限制
    if (depth > this.MAX_DEPTH) {
      return '[Max Depth Exceeded]';
    }

    // 熔断 2: 循环引用检测
    if (visited.has(obj)) {
      return '[Circular Reference Detected]';
    }

    // 熔断 3: 禁止直接返回 TypeORM 实体 (根据特殊属性识别)
    // 或者是含有复杂方法的类实例
    if (obj.constructor && obj.constructor.name.endsWith('Entity')) {
      // 如果是实体，强制执行简单的 POJO 转换（仅保留自有属性）
      const dehydrated: any = {};
      visited.add(obj);
      for (const key of Object.keys(obj)) {
        dehydrated[key] = this.sanitize(obj[key], depth + 1, visited);
      }
      return dehydrated;
    }

    // 正常对象处理
    if (Array.isArray(obj)) {
      const arr = [];
      visited.add(obj);
      for (const item of obj) {
        arr.push(this.sanitize(item, depth + 1, visited));
      }
      return arr;
    } else {
      const newObj: any = {};
      visited.add(obj);
      for (const key of Object.keys(obj)) {
        newObj[key] = this.sanitize(obj[key], depth + 1, visited);
      }
      return newObj;
    }
  }
}
