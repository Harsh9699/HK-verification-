import os
import re

files = ['admin.html', 'student.html', 'verify.html', 'index.html']

def update_file(path):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace imports
    content = re.sub(r"@import url\('https://fonts.googleapis.com/css2\?family=Inter[^']*'\);", "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');", content)
    content = re.sub(r"@import url\('https://fonts.googleapis.com/css2\?family=Playfair\+Display[^']*'\);", "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&display=swap');", content)

    # Replace fonts
    content = content.replace("'Inter'", "'Outfit'")
    content = content.replace("'Playfair Display'", "'Cormorant Garamond'")

    # Replace colors
    # --primary: #4F46E5 -> #0f172a (Slate 900)
    content = content.replace("--primary: #4F46E5", "--primary: #0f172a")
    content = content.replace("--primary-hover: #4338CA", "--primary-hover: #1e293b")
    # --secondary: #10B981 -> #d97706 (Amber 600)
    content = content.replace("--secondary: #10B981", "--secondary: #d97706")
    
    # Backgrounds
    content = content.replace("linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)", "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)")
    content = content.replace("background: #f8fafc;", "background: #f1f5f9;")
    
    # Fix the specific hardcoded blue colors in index.html and student.html
    # In index.html
    content = content.replace("background: #EEF2FF", "background: #f1f5f9")
    content = content.replace("background: #ECFDF5", "background: #fef3c7")
    content = content.replace("border-color: #C7D2FE", "border-color: #cbd5e1")
    content = content.replace("rgba(79, 70, 229", "rgba(15, 23, 42")
    
    # Orbs in index.html
    content = content.replace("background: #e0e7ff", "background: #e2e8f0")
    content = content.replace("background: #dcfce7", "background: #fde68a")
    
    # Orbs in student.html
    content = content.replace("background: #c7d2fe", "background: #cbd5e1")
    content = content.replace("background: #a7f3d0", "background: #fde68a")

    # Write back
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated", path)

for f in files:
    update_file(f)
