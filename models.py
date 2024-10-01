from pydantic import BaseModel
from typing import Union, Optional
from typing import Optional, Union

class ClassItem(BaseModel):
    codnivel1: int
    codnivel2: Optional[int]  # Aceita int ou None
    codnivel3: Optional[int]  # Aceita int ou None
    codnivel4: Optional[int]  # Aceita int ou None
    codnivel5: Optional[int]  # Aceita int ou None
    codclasse: int
    descclasse: str


class PredictData(BaseModel):
    grau: str
    codigo_classe: str
    codigo_assunto: str
    #codigo_formato: str
    orgao_codigo: str
    classe_nivel1: str
    classe_nivel2: str
    classe_nivel3: str
    classe_nivel4: str
    classe_nivel5: str
    assunto_nivel1: str
    assunto_nivel2: str
    assunto_nivel3: str
    assunto_nivel4: str
    assunto_nivel5: str