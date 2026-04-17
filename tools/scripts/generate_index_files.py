import os
import json

# Configuration des chemins
GENERATION_SUMMARY_DATA = [
    {
        "type" : "candidates",
        "data_path" : "assets/data/candidates",
        "index_file_path" : os.path.join("assets/data/candidates", "summary", "index-candidates.json")
    },
    {   
        "type" : "initiatives",
        "data_path" : "assets/data/initiatives",
        "index_file_path" : os.path.join("assets/data/initiatives", "summary", "index-initiatives.json")
    },
    {   
        "type" : "criteria",
        "data_path" : "assets/data/criteria",
        "index_file_path" : os.path.join("assets/data/criteria", "summary", "index-criteria.json")
    },
    {   
        "type" : "analyse_visuals",
        "data_path" : "assets/data/analyse_visuals",
        "index_file_path" : os.path.join("assets/data/analyse_visuals", "summary", "index-analyse_visuals.json")
    }
]

def generate_index(origin_data):
    data_path = origin_data["data_path"]
    index_file_path = origin_data["index_file_path"]

    if not os.path.exists(data_path):
        print(f"❌ Dossier introuvable : {data_path}")
        return

    data_files = []
    
    # Scan du dossier
    for filename in os.listdir(data_path):
        if filename.endswith(".json"):
            data_files.append(filename.replace(".json", ""))

    data_files.sort()

    try:
        with open(index_file_path, 'w', encoding='utf-8') as f:
            json.dump(data_files, f, indent=4)
        print(f"✅ Index généré avec succès : {len(data_files)} {origin_data["type"]}] trouvés.")
    except Exception as e:
        print(f"❌ Erreur lors de l'écriture de l'index : {e}")

if __name__ == "__main__":
    for origin_data in GENERATION_SUMMARY_DATA:
        generate_index(origin_data)