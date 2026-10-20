# Simulador de Consenso Hashgraph (Terminal)

Este componente permite visualizar la propagación de eventos y el cálculo del consenso mediante **Virtual Voting** por consola.

## Requisitos
- Python 3.10 o superior (no requiere librerías externas adicionales).

## Ejecución
Abre una terminal en esta carpeta y ejecuta:

```bash
# En Windows:
py main.py

# O en Linux / Mac:
python3 main.py
```

## Nodos simulados
- **Mauro**
- **Diego**
- **Alice**
- **Bob**

## Funcionamiento
1. Inicializa los eventos génesis por cada nodo.
2. Simula intercambios de información (Gossip about Gossip) entre nodos al azar.
3. Asocia transacciones reales de pagos y registros.
4. Calcula automáticamente la supermayoría BFT (> 2/3 de la red).
5. Imprime el orden definitivo e inmutable acordado por consenso.
