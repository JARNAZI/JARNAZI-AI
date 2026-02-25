
import re

def find_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    stack = [] # Stack of sets, each set contains keys of the current object
    current_obj_keys = set()
    duplicates = []
    
    for i, line in enumerate(lines):
        # Track braces to know when objects start/end
        # Very simplified: assumes { starts an object and } ends it
        # Does not handle nested objects on same line properly, but good enough for this file structure
        
        # Match keys like '  key:' or '  "key":' or "  'key':"
        # We only care about keys that are at least somewhat indented
        match = re.search(r'^\s+(\w+):', line)
        if match:
            key = match.group(1)
            if key in current_obj_keys:
                duplicates.append((i + 1, key))
            else:
                current_obj_keys.add(key)
        
        if '{' in line and not line.strip().startswith('//'):
            # If there are multiple { on the line, it might be complex, but we'll ignore for now
            count_open = line.count('{')
            for _ in range(count_open):
                stack.append(current_obj_keys)
                current_obj_keys = set()
                
        if '}' in line and not line.strip().startswith('//'):
            count_close = line.count('}')
            for _ in range(count_close):
                if stack:
                    current_obj_keys = stack.pop()

    return duplicates

if __name__ == "__main__":
    file_to_check = r'c:\Users\HP\Downloads\Ja_fixed_57_final_checklist_fixes-1\src\i18n\dictionaries\de.ts'
    dupes = find_duplicates(file_to_check)
    if dupes:
        print("Found duplicates:")
        for line_num, key in dupes:
            print(f"Line {line_num}: {key}")
    else:
        print("No duplicates found.")
