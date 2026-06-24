import os
import json
import sys

# ==============================================================================
#  🎮 ARBORITO GAME BUILDER
# ==============================================================================
# This script scans the 'cartridges' directory and generates a manifest.json
# describing the available games.
#
# FEATURES:
# - Scans subdirectories containing index.html
# - Scans standalone .html files (e.g. juego3.html)
# - Robust path detection (works from any execution directory)
# ==============================================================================

def main():
    # 1. Determine absolute paths (Robustness Fix)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    games_dir = os.path.join(script_dir, "cartridges")
    output_file = os.path.join(script_dir, "manifest.json")

    print(f"📍 Script Location: {script_dir}")
    print(f"🕹️  Scanning games in: {games_dir}")
    
    if not os.path.exists(games_dir):
        print(f"❌ Error: Directory '{games_dir}' not found.")
        print(f"   Ensure 'cartridges' folder is next to this script.")
        return

    games = []
    
    # 2. Get all items in the directory
    try:
        items = sorted(os.listdir(games_dir))
    except Exception as e:
        print(f"❌ Error listing directory: {e}")
        return

    for item in items:
        # Skip hidden files and the manifest itself
        if item.startswith('.') or item == "manifest.json": continue
        
        full_path = os.path.join(games_dir, item)
        
        # TYPE A: Folder with index.html (Standard)
        if os.path.isdir(full_path):
            index_file = os.path.join(full_path, "index.html")
            if os.path.exists(index_file):
                print(f"   ✅ Found game folder: {item}")
                
                # Metadata
                meta_file = os.path.join(full_path, "meta.json")
                meta = {}
                if os.path.exists(meta_file):
                    try:
                        with open(meta_file, 'r', encoding='utf-8') as f: meta = json.load(f)
                    except: pass

                name = item.replace("-", " ").replace("_", " ").title()
                
                games.append({
                    "id": item,
                    "name": meta.get("name", f"Arborito Academy: {name}"),
                    "description": meta.get("description", "An interactive educational experience."),
                    "icon": meta.get("icon", "👾"),
                    "path": f"./cartridges/{item}/index.html", # Relative to manifest.json
                    "version": meta.get("version", "1.0.0"),
                    "author": meta.get("author", "Community")
                })
            else:
                # Folder without index.html -> Skip or Warn
                pass

        # TYPE B: Standalone HTML File (e.g. juego3.html)
        elif os.path.isfile(full_path) and item.endswith(".html"):
            print(f"   ✅ Found standalone game: {item}")
            
            clean_id = item.replace(".html", "")
            name = clean_id.replace("-", " ").replace("_", " ").title()
            
            games.append({
                "id": clean_id,
                "name": f"Arborito Arcade: {name}",
                "description": "Standalone game module.",
                "icon": "🕹️",
                "path": f"./cartridges/{item}", # Relative to manifest.json
                "version": "1.0.0",
                "author": "Community"
            })

    # 3. Write manifest
    if games:
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(games, f, indent=4)
            print(f"\n✨ Generated manifest with {len(games)} games at: {output_file}")
        except Exception as e:
            print(f"❌ Error writing manifest: {e}")
    else:
        print("\n⚠️ No games found.")

if __name__ == "__main__":
    main()
