import os
import sys
import argparse
import json

# 动态将核心包路径加入环境变量
package_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../smart-resume")
sys.path.append(package_dir)

from smartresume import ResumeAnalyzer

def main():
    parser = argparse.ArgumentParser(description="SmartResume CLI: 批量解析简历中枢")
    parser.add_argument("--dir", type=str, help="简历所在目录路径")
    parser.add_argument("--file", type=str, help="单简历文件路径")
    parser.add_argument("--extract_types", type=str, default="all", help="提取类型 (目前支持 all)")
    
    args = parser.parse_args()
    
    # 动态将核心包路径加入环境变量，确保可直接在本目录运行脚本
    package_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../smart-resume")
    sys.path.append(package_dir)
    
    analyzer = ResumeAnalyzer(init_ocr=True)
    
    results = []
    
    if args.file:
        print(f"[*] 正在解析单文件: {args.file}", file=sys.stderr)
        try:
            result = analyzer.analyze_file(args.file)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except Exception as e:
            print(f"[!] 解析失败: {str(e)}", file=sys.stderr)
            
    elif args.dir:
        if not os.path.exists(args.dir):
            print(f"[!] 目录不存在: {args.dir}", file=sys.stderr)
            return
            
        print(f"[*] 正在批量处理目录: {args.dir}", file=sys.stderr)
        for filename in os.listdir(args.dir):
            if filename.lower().endswith((".pdf", ".docx", ".txt")):
                file_path = os.path.join(args.dir, filename)
                print(f"  -> 正在解析: {filename}", file=sys.stderr)
                try:
                    result = analyzer.analyze_file(file_path)
                    results.append({"filename": filename, "data": result})
                except Exception as e:
                    print(f"  [!] {filename} 解析异常: {str(e)}", file=sys.stderr)
        
        # 输出汇总结果
        output_file = "batch_parsing_results.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n[+] 批量处理完成，共解析 {len(results)} 份简历。结果已存入 {output_file}")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
