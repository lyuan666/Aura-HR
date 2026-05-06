# 手机号登录支持 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许用户使用手机号+密码登录系统，与现有邮箱登录方式并存。

**Architecture:** 修改 LoginDto 将 `email` 字段泛化为 `account` 字段，接受邮箱或手机号。AuthService.login() 自动检测输入类型（邮箱含 `@`，手机号为纯数字），分别查询 `email` 或 `phone` 列。前端登录表单 placeholder 改为 "邮箱/手机号"，移除仅邮箱格式的校验。

**Tech Stack:** NestJS class-validator 自定义校验、TypeORM、Ant Design ProFormText、Next.js

---

### Task 1: 后端 — LoginDto 支持手机号或邮箱

**Files:**
- Modify: `apps/api/src/modules/auth/auth.dto.ts:31-38`

- [ ] **Step 1: 修改 LoginDto**

将 `email` 字段改为 `account`，使用自定义校验替代 `@IsEmail()`：

```typescript
// apps/api/src/modules/auth/auth.dto.ts

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

`account` 字段不做格式校验，格式判断由 AuthService 处理。

- [ ] **Step 2: 提交**

```bash
git add apps/api/src/modules/auth/auth.dto.ts
git commit -m "refactor: LoginDto email 字段泛化为 account 支持手机号登录"
```

---

### Task 2: 后端 — AuthService 支持手机号查询

**Files:**
- Modify: `apps/api/src/modules/auth/auth.service.ts:72-81`

- [ ] **Step 1: 修改 login() 方法**

```typescript
// apps/api/src/modules/auth/auth.service.ts — login() 方法

async login(dto: LoginDto) {
  const isEmail = dto.account.includes('@');
  const where = isEmail
    ? { email: dto.account }
    : { phone: dto.account };
  const user = await this.userRepo.findOne({ where });
  if (!user) throw new UnauthorizedException('账号或密码错误');
  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException('账号或密码错误');
  if (!user.isActive) throw new UnauthorizedException('账号已被禁用');
  return this.generateTokens(user);
}
```

同时更新错误消息从 "邮箱或密码错误" 改为 "账号或密码错误"。

- [ ] **Step 2: 更新 auth.service.spec.ts 中的 login 相关测试**

测试文件路径: `apps/api/src/modules/auth/auth.service.spec.ts`

在测试中将 `email` 字段改为 `account`，确保以下用例通过:
- 邮箱登录成功
- 手机号登录成功
- 错误密码
- 用户不存在
- 账号被禁用

- [ ] **Step 3: 运行测试验证**

```bash
cd apps/api && npx jest --testPathPattern="auth.service.spec" --no-cache
```

- [ ] **Step 4: 提交**

```bash
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "feat: AuthService 支持手机号登录查询"
```

---

### Task 3: 前端 — 登录表单支持手机号输入

**Files:**
- Modify: `apps/web/src/app/login/page.tsx:54-71`

- [ ] **Step 1: 修改登录表单**

将邮箱字段改为通用账号字段：

```tsx
// apps/web/src/app/login/page.tsx — 替换 email ProFormText

<ProFormText
  name="account"
  fieldProps={{
    size: 'large',
    prefix: <UserOutlined />,
  }}
  placeholder={'邮箱/手机号'}
  rules={[
    {
      required: true,
      message: '请输入邮箱或手机号',
    },
  ]}
/>
```

密码字段保持不变。

- [ ] **Step 2: 确认 handleSubmit 中的 POST body**

当前代码 (约 line 16-19):
```tsx
const res = await api.post('/auth/login', {
  email: values.email,
  password: values.password,
});
```

改为:
```tsx
const res = await api.post('/auth/login', {
  account: values.account,
  password: values.password,
});
```

- [ ] **Step 3: 手动验证**

```bash
# 确保前后端都在运行
# 浏览器打开 http://localhost:3003/login
# 测试: 用邮箱登录 → 成功跳转 dashboard
# 测试: 用手机号登录 → 成功跳转 dashboard
# 测试: 输入错误密码 → 显示错误提示
```

- [ ] **Step 4: 提交**

```bash
git add apps/web/src/app/login/page.tsx
git commit -m "feat: 前端登录表单支持手机号登录"
```

---

### Task 4: 用户实体 — phone 列添加唯一索引

**Files:**
- Modify: `apps/api/src/entities/user.entity.ts:28-29`

- [ ] **Step 1: 给 phone 列添加唯一索引**

```typescript
// apps/api/src/entities/user.entity.ts

@Column({ nullable: true, unique: true })
phone: string;
```

- [ ] **Step 2: 提交**

```bash
git add apps/api/src/entities/user.entity.ts
git commit -m "feat: user entity phone 列添加唯一索引"
```

---

## 文件变更汇总

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/api/src/modules/auth/auth.dto.ts` | 修改 | LoginDto.email → LoginDto.account |
| `apps/api/src/modules/auth/auth.service.ts` | 修改 | login() 支持邮箱/手机号双查询 |
| `apps/api/src/modules/auth/auth.service.spec.ts` | 修改 | 更新测试用例 |
| `apps/web/src/app/login/page.tsx` | 修改 | 表单字段 + placeholder + POST body |
| `apps/api/src/entities/user.entity.ts` | 修改 | phone 添加 unique 约束 |

## Self-Review Checklist

- [x] Spec coverage: 所有需求都有对应 Task
- [x] Placeholder scan: 无 TBD/TODO/模糊描述
- [x] Type consistency: account 字段在 DTO、Service、前端中命名一致
