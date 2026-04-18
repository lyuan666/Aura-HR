import os
import json
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv
import mammoth
from pypdf import PdfReader

class ResumeAnalyzer:
    def __init__(self, init_ocr: bool = False):
        load_dotenv()
        # 兼容 .env 中的多种 Key 命名
        self.api_key = os.getenv("ZHIPU_API_KEY") or os.getenv("BIGMODEL_API_KEY")
        self.api_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.model = "glm-4-flash"
        self.init_ocr = init_ocr

    def _call_ai(self, messages: List[Dict[str, str]], json_mode: bool = True) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("ZHIPU_API_KEY not configured in environment")

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "top_p": 0.7,
        }
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(self.api_url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        
        content = response.json()["choices"][0]["message"]["content"]
        
        if json_mode:
            try:
                # 提取 JSON 块
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "{" in content:
                    content = content[content.find("{"):content.rfind("}")+1]
                return json.loads(content)
            except Exception as e:
                print(f"AI response: {content}")
                raise ValueError(f"Failed to parse JSON from AI response: {str(e)}")
        
        return {"content": content}

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        elif ext == ".docx":
            with open(file_path, "rb") as docx_file:
                result = mammoth.extract_raw_text(docx_file)
                return result.value
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """
        核心解析方法：遵循 plan.md 中的 Resume Analyst 规范
        """
        text_content = self.extract_text(file_path)
        
        # 使用 plan.md 定义的 Prompt 工程
        system_prompt = """# Role: Resume Analyst : 专注于从简历中提取关键信息，并将其转化为结构化数据。
## Goals
提取简历中的技能、工作经历、教育背景和项目经历。
将提取的信息转化为结构化数据格式。
## Constrains
必须保持原始简历内容的准确性和完整性。
结构化数据应清晰、易于理解和检索。
## Skills
简历内容分析能力，数据结构化处理能力，精确的信息提取和总结能力
## Outputformat
请严格输出 JSON 格式，包含字段: name, phone, email, skills (数组), experience (工作经历列表), education (教育背景列表), projects (项目经历列表), yearsOfExperience (数字), summary (一句话总结).
"""

        user_content = f"1.仔细阅读并分析简历内容：\n\n{text_content[:15000]}\n\n2.提取关键信息并以JSON输出。"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        return self._call_ai(messages)
