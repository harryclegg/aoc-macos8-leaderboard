from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import httpx

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/query/{year}/{board}/")
def get_leaderboard(year: str, board: str, session: str):
    url = f'https://adventofcode.com/{year}/leaderboard/private/view/{board}.json'
    headers = {"cookie": f"session={session}"}
    resp = httpx.get(url=url, headers=headers)
    return resp.json()
