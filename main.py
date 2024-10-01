import os
import json
import httpx
from collections import OrderedDict, defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from models import PredictData

app = FastAPI()
origins = [
    "http://127.0.0.1:8090",  
    "http://127.0.0.1:8000", 
]

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Função para retornar arquivos estáticos sem cache
@app.get("/static/{file_path:path}")
async def static_file(file_path: str):
    return FileResponse(f"static/{file_path}", headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

# Servir a página inicial
@app.get("/", response_class=HTMLResponse)
async def serve_home():
    try:
        file_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Página não encontrada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Caminho para os arquivos JSON
json_file_classes_path = os.path.join(os.path.dirname(__file__), "models", "tpu-classes.json")
json_file_assuntos_path = os.path.join(os.path.dirname(__file__), "models", "tpu-assuntos.json")
json_file_orgaos_path = os.path.join(os.path.dirname(__file__), "models", "orgaos.json")

# Função para construir a árvore para classes ou assuntos
def build_tree(data, cod_key, desc_key):
    tree = defaultdict(lambda: {"children": {}})
    for item in data:
        nivel1 = item['codnivel1']
        nivel2 = item.get('codnivel2')
        nivel3 = item.get('codnivel3')
        nivel4 = item.get('codnivel4')
        nivel5 = item.get('codnivel5')
        cod_item = item[cod_key]
        desc_item = item[desc_key]

        # Nível 1
        if nivel1 not in tree:
            tree[nivel1] = {
                "id": f"nivel1-{nivel1}",
                "text": f"{nivel1} - {desc_item}",
                "icon": "fa fa-folder",
                "children": {}
            }

        current_level = tree[nivel1]['children']

        # Nível 2 a Nível 5 (mesma lógica para cada nível)
        for nivel, codnivel in enumerate([nivel2, nivel3, nivel4, nivel5], start=2):
            if codnivel and codnivel != "NULL":
                if codnivel not in current_level:
                    current_level[codnivel] = {
                        "id": f"nivel{nivel}-{nivel1}-{codnivel}",
                        "text": f"{codnivel} - {desc_item}",
                        "icon": "fa fa-folder" if nivel < 5 else "fa fa-file-alt",
                        "children": {}
                    }
                current_level = current_level[codnivel]['children']

        # Adicionar cod_item no nível apropriado
        if cod_item not in current_level:
            current_level[cod_item] = {
                "id": f"classe-{cod_item}",
                "text": f"{cod_item} - {desc_item}",
                "icon": "fa fa-file-alt",
                "children": []
            }
    return tree_to_list(tree)

# Função para converter dicionário para lista
def tree_to_list(tree):
    result = []
    for key, value in tree.items():
        node = {
            "id": value["id"],
            "text": value["text"],
            "icon": value.get("icon", "fa fa-file-alt"),
            "children": tree_to_list(value["children"]) if value["children"] else []
        }
        result.append(node)
    return result

# Endpoint para Classes
@app.get("/api/classes")
async def get_classes():
    try:
        with open(json_file_classes_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        tree_data = build_tree(data, 'codclasse', 'descclasse')
        return JSONResponse(content=tree_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para Assuntos
@app.get("/api/assuntos")
async def get_assuntos():
    try:
        with open(json_file_assuntos_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        tree_data = build_tree(data, 'codassunto', 'descassunto')
        return JSONResponse(content=tree_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint para Órgãos
@app.get("/api/orgaos")
async def get_orgaos():
    try:
        with open(json_file_orgaos_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint para receber os dados e enviá-los no formato correto
@app.post("/api/predict")
async def predict(data: PredictData):
    try:
        # Simular o processamento dos dados recebidos
        print("Dados recebidos:", data.dict())
        return {"message": " Dados recebidos com sucesso!", "dados": data.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))