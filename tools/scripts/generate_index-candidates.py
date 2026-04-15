import os
import json

# Configuration des chemins
DATA_PATH = "assets/data/candidates"
OUTPUT_FILE_NAME = "index-candidates.json"
INDEX_FILE = os.path.join(DATA_PATH, "summary", OUTPUT_FILE_NAME)

def validate_structure(data, filename):
    """Vérifie si les champs obligatoires sont présents."""
    required_fields = ["id", "identity", "professional", "education", "psychology"]
    for field in required_fields:
        if field not in data:
            print(f"⚠️ Erreur : Champ '{field}' manquant dans {filename}")
            return False
    return True

def generate_index():
    if not os.path.exists(DATA_PATH):
        print(f"❌ Dossier introuvable : {DATA_PATH}")
        return

    candidate_files = []
    
    # Scan du dossier
    for filename in os.listdir(DATA_PATH):
        if filename.endswith(".json") and filename != OUTPUT_FILE_NAME:
            file_path = os.path.join(DATA_PATH, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Validation
                    if validate_structure(data, filename):
                        # On retire l'extension .json pour l'index
                        candidate_files.append(filename.replace(".json", ""))
            except Exception as e:
                print(f"❌ Impossible de lire {filename} : {e}")

    candidate_files.sort()
    try:
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(candidate_files, f, indent=4)
        print(f"✅ Index généré avec succès : {len(candidate_files)} candidats trouvés.")
    except Exception as e:
        print(f"❌ Erreur lors de l'écriture de l'index : {e}")

if __name__ == "__main__":
    generate_index()