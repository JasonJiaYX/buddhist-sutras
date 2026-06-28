import json
import os
import random
import sys
import subprocess
import urllib.request
import urllib.parse

CHAT_ID = "oc_970147fb612574bbb9781cd461bf24c4"

# Available classics JSON files in data/
CLASSICS_FILES = [
    "daodejing.json", "taishang.json", "qingjingjing.json", 
    "lunyu.json", "zhong-yong.json", "liaofan.json", 
    "yinzhiwen.json", "xin-jing.json", "jingang-jing.json", 
    "pumen-pin.json"
]

def load_gemini_api_key():
    # 1. Check environment variable
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key
    # 2. Check local config.json in buddhist-sutras
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, "config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                api_key = config.get("GEMINI_API_KEY")
                if api_key:
                    return api_key
        except Exception:
            pass
    # 3. Check config.json in sibling ai_news_pusher
    pusher_config = os.path.join(os.path.dirname(script_dir), "ai_news_pusher", "config.json")
    if os.path.exists(pusher_config):
        try:
            with open(pusher_config, "r", encoding="utf-8") as f:
                config = json.load(f)
                api_key = config.get("GEMINI_API_KEY")
                if api_key:
                    return api_key
        except Exception:
            pass
    return None

def load_feishu_webhook():
    # Check environment variable
    webhook = os.environ.get("FEISHU_WEBHOOK")
    if webhook:
        return webhook
    # Check local config.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, "config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                webhook = config.get("FEISHU_WEBHOOK")
                if webhook:
                    return webhook
        except Exception:
            pass
    return None

def call_gemini_api(prompt, system_instruction, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    contents = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {"responseMimeType": "application/json"}
    }
    req_data = json.dumps(contents).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            response_data = json.loads(res.read().decode("utf-8"))
            candidates = response_data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text
            return None
    except Exception as e:
        print(f"Gemini API call failed: {e}", file=sys.stderr)
        return None

def extract_json_from_response(text):
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        nl_idx = cleaned.find("\n")
        if nl_idx != -1:
            cleaned = cleaned[nl_idx:].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"Failed to parse JSON from Gemini response: {e}\nRaw response: {text}", file=sys.stderr)
        return None

def send_via_webhook(webhook_url, title, content_markdown):
    headers = {"Content-Type": "application/json"}
    body = {
        "msg_type": "interactive",
        "card": {
            "config": {"wide_screen_mode": True},
            "header": {
                "title": {"tag": "plain_text", "content": title},
                "template": "blue"
            },
            "elements": [
                {
                    "tag": "markdown",
                    "content": content_markdown
                }
            ]
        }
    }
    req_data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=req_data,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            res_body = res.read().decode("utf-8")
            data = json.loads(res_body)
            if data.get("code") == 0:
                print("Successfully sent message via Webhook.")
                return True
            else:
                print(f"Webhook failed: {data}", file=sys.stderr)
                return False
    except Exception as e:
        print(f"Error sending Webhook: {e}", file=sys.stderr)
        return False

def send_via_lark_cli(chat_id, title, content_markdown):
    js_path = r"C:\Users\JasonJia\AppData\Roaming\npm\node_modules\@larksuite\cli\scripts\run.js"
    card_markdown = f"# 🪷 {title}\n\n{content_markdown}"
    try:
        result = subprocess.run([
            "node",
            js_path,
            "im",
            "+messages-send",
            "--chat-id",
            chat_id,
            "--markdown",
            card_markdown
        ], capture_output=True, text=True)
        if result.returncode == 0:
            print("Successfully sent message via Lark CLI.")
            return True
        else:
            print(f"Lark CLI failed: {result.stderr}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error running Lark CLI: {e}", file=sys.stderr)
        return False

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    
    # 1. Pick a random classic file
    selected_file = random.choice(CLASSICS_FILES)
    json_path = os.path.join(data_dir, selected_file)
    print(f"Selected classic file: {selected_file}")
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist.", file=sys.stderr)
        sys.exit(1)
        
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    title = data.get("title", "国学经典")
    chapters = data.get("chapters", [])
    if not chapters:
        print("Error: No chapters found.", file=sys.stderr)
        sys.exit(1)
        
    # 2. Pick a random chapter and paragraph
    chapter = random.choice(chapters)
    chapter_title = chapter.get("title", "正文")
    paragraphs = chapter.get("paragraphs", [])
    if not paragraphs:
        print("Error: No paragraphs found.", file=sys.stderr)
        sys.exit(1)
        
    p = random.choice(paragraphs)
    
    # Parse paragraph format
    pre_translation = ""
    pre_notes = []
    
    if isinstance(p, dict):
        original_text = p.get("original", "")
        pre_translation = p.get("translation", "")
        notes_raw = p.get("notes", [])
        if isinstance(notes_raw, list):
            pre_notes = notes_raw
        elif isinstance(notes_raw, str):
            pre_notes = [notes_raw]
    else:
        original_text = str(p)
        
    original_text = original_text.strip()
    if not original_text:
        print("Error: Empty paragraph.", file=sys.stderr)
        sys.exit(1)
        
    print(f"Classic: {title} - {chapter_title}")
    print(f"Original Text: {original_text[:30]}...")
    
    # 3. Get master-level translation & reflection
    gemini_key = load_gemini_api_key()
    translation = pre_translation
    explanation = ""
    
    if gemini_key:
        print("Calling Gemini API for master-level translation and reflection...")
        system_instruction = (
            "你是一位精通儒释道经典、融汇贯通传统文化的国学大师（风格融合钱穆、南怀瑾等诸子百家解读大师的深厚见解与讲学风格）。\n"
            "针对给出的国学经典段落（及可能附带的现有译文和注释），请提供最符合权威学术释义的现代白话译文，"
            "并结合国学大师级别的深厚智慧，为现代读者撰写一段立意深远、直击人心、用于修身省己的人生启迪与生活修行指南。\n"
            "要求：内容必须深刻、有启发性，避免平庸空洞的鸡汤词句。请输出符合以下JSON Schema的JSON对象：\n"
            "{\n"
            '  "translation": "现代白话译文",\n'
            '  "explanation": "国学大师级的人生启迪与修身指南"\n'
            "}\n"
            "请直接输出该JSON对象，不要带任何 markdown 的包围代码块标识符（如 ```json）。"
        )
        
        prompt = f"书名：《{title}》\n章节：{chapter_title}\n原文：\n{original_text}\n"
        if pre_translation:
            prompt += f"参考白话译文：\n{pre_translation}\n"
        if pre_notes:
            prompt += "参考注释：\n" + "\n".join(pre_notes) + "\n"
            
        response_text = call_gemini_api(prompt, system_instruction, gemini_key)
        result_json = extract_json_from_response(response_text)
        
        if result_json:
            translation = result_json.get("translation", translation)
            explanation = result_json.get("explanation", "")
            
    # 4. Formulate date and lunar calendar (UTC+8)
    date_str = ""
    try:
        from datetime import datetime, timezone, timedelta
        from zhdate import ZhDate
        tz_beijing = timezone(timedelta(hours=8))
        now_beijing = datetime.now(timezone.utc) + timedelta(hours=8)
        now_beijing_naive = now_beijing.replace(tzinfo=None)
        lunar_date = ZhDate.from_datetime(now_beijing_naive)
        lunar_str = lunar_date.chinese()
        parts = lunar_str.split()
        lunar_md = parts[0][5:] if len(parts[0]) > 5 else parts[0]
        date_str = f"📅 **{now_beijing.strftime('%Y年%m月%d日')}** (农历{lunar_md})\n\n"
    except Exception as e:
        print(f"Failed to get lunar date: {e}", file=sys.stderr)
        try:
            from datetime import datetime, timezone, timedelta
            now_beijing = datetime.now(timezone.utc) + timedelta(hours=8)
            date_str = f"📅 **{now_beijing.strftime('%Y年%m月%d日')}**\n\n"
        except Exception:
            pass

    # 5. Formulate markdown text for Feishu
    markdown_content = date_str
    markdown_content += f"**【经典出处】**\n《{title}》 · {chapter_title}\n\n"
    markdown_content += f"**【经典原文】**\n> {original_text}\n\n"
    
    if translation:
        markdown_content += f"**【白话译文】**\n{translation}\n\n"
        
    if explanation:
        markdown_content += f"**【大师启迪】**\n{explanation}\n\n"
    else:
        # Fallback if no AI key or API failure
        if pre_notes:
            markdown_content += "**【字词注解】**\n" + "\n".join(f"- {note}" for note in pre_notes) + "\n\n"
        if not gemini_key:
            markdown_content += "*(提示：系统未检测到 GEMINI_API_KEY。配置密钥后，云端可自动生成大师级的译文和修身启迪。)*\n"
            
    # 6. Send message
    webhook_url = load_feishu_webhook()
    card_title = "🪷 每日国学经典"
    
    success = False
    if webhook_url:
        print("Sending via Feishu Webhook...")
        success = send_via_webhook(webhook_url, card_title, markdown_content)
    else:
        print("No FEISHU_WEBHOOK configured. Falling back to local Lark CLI...")
        success = send_via_lark_cli(CHAT_ID, card_title, markdown_content)
        
    if success:
        print("Daily classics push completed successfully!")
    else:
        print("Failed to complete push.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
