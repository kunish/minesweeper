const size = 20,
  cols = 20,
  rows = 20,
  bombs = 20

class Cell {
  constructor({ container, isBomb = false, neighborsBombCount = 0, colIndex, rowIndex }) {
    Object.assign(this, {
      container,
      isBomb,
      neighborsBombCount,
      colIndex,
      rowIndex,
    })
  }

  reveal() {
    if (this.isBomb) {
      this.container.classList.add("bomb")
    } else if (!this.isRevealed) {
      this.container.classList.add("revealed")
      this.isRevealed = true
    }

    if (this.neighborsBombCount > 0 && !this.isBomb) {
      this.container.innerHTML = this.neighborsBombCount
    }
  }
}

class Minesweeper {
  GameData = {}

  constructor({ rows, cols, bombs, size, container }) {
    const total = rows * cols
    if (bombs > total) {
      throw new Error(`Bomb is too many`)
    }
    Object.assign(this.GameData, {
      rows,
      cols,
      total,
      bombs,
      size,
    })
    this.container = container

    const map = this.genMap()
    this.GameData.map = map

    const bombCells = this.genBombs()
    this.GameData.bombCells = bombCells
    this.updateNeighbors()
    Object.freeze(this.GameData)

    this.game = this.genGame()

    this.render()
    this.attachListener()
  }

  genMap() {
    const { rows, cols } = this.GameData
    return Array.from(new Array(rows).keys()).map((rowIndex) =>
      Array.from(new Array(cols).keys()).map(
        (colIndex) =>
          new Cell({
            colIndex,
            rowIndex,
          })
      )
    )
  }

  updateNeighbors() {
    const { map } = this.GameData

    map.forEach((row) => {
      row.forEach((cell) => {
        const { rowIndex, colIndex } = cell
        const neighbors = this.getNeighbors({ rowIndex, colIndex })
        const neighborsBombCount = Object.keys(neighbors)
          .filter((neighbor) => neighbors[neighbor] instanceof Cell)
          .reduce((acc, neighbor) => (neighbors[neighbor].isBomb ? acc + 1 : acc), 0)
        cell.neighborsBombCount = neighborsBombCount
      })
    })
  }

  genBombs() {
    const { map, rows, cols, bombs } = this.GameData
    const bombCells = []
    let planted = 0

    while (planted < bombs) {
      const rowIndex = Math.floor(Math.abs(Math.random() * rows))
      const colIndex = Math.floor(Math.abs(Math.random() * cols))
      const cell = map[rowIndex][colIndex]
      if (cell && !cell.isBomb) {
        cell.isBomb = true
        bombCells.push(cell)

        planted++
      }
    }

    return bombCells
  }

  getNeighbors({ rowIndex, colIndex }) {
    const neighbors = {}
    const { map } = this.GameData

    const prevRow = map[rowIndex - 1],
      nextRow = map[rowIndex + 1],
      row = map[rowIndex],
      left = row[colIndex - 1],
      right = row[colIndex + 1]
    let topLeft, top, topRight, bottomLeft, bottom, bottomRight
    if (prevRow) {
      topLeft = prevRow[colIndex - 1]
      top = prevRow[colIndex]
      topRight = prevRow[colIndex + 1]
    }
    if (nextRow) {
      bottomLeft = nextRow[colIndex - 1]
      bottom = nextRow[colIndex]
      bottomRight = nextRow[colIndex + 1]
    }

    Object.assign(neighbors, {
      topLeft,
      top,
      topRight,
      left,
      right,
      bottomLeft,
      bottom,
      bottomRight,
    })

    return neighbors
  }

  genGame() {
    const { size, map } = this.GameData
    return map.map((row) => {
      const rowElement = document.createElement("div")
      rowElement.classList.add("row")

      row.forEach((item) => {
        const gameItem = document.createElement("div")
        gameItem.classList.add("item")
        gameItem.dataset["col"] = item.colIndex
        gameItem.dataset["row"] = item.rowIndex
        if (typeof size === "number") {
          gameItem.style.setProperty("--size", `${size}px`)
        }
        item.container = gameItem

        rowElement.appendChild(gameItem)
      })

      return rowElement
    })
  }

  render() {
    if (this.container.children.length > 0) {
      const r = new Range()
      r.selectNodeContents(this.container)
      r.deleteContents()
    }
    this.game.forEach((rowElement) => {
      this.container.appendChild(rowElement)
    })
  }

  attachListener() {
    const { map } = this.GameData

    document.addEventListener("click", ({ target }) => {
      if (target.classList.contains("item")) {
        const { col, row } = target.dataset
        const colIndex = Number.parseInt(col),
          rowIndex = Number.parseInt(row)

        const { isRevealed, isBomb, neighborsBombCount } = map[rowIndex][colIndex]
        map[rowIndex][colIndex].reveal()

        if (isBomb) {
          this.revealAll()
        }

        if (!isRevealed && !isBomb && neighborsBombCount === 0) {
          this.revealEmpty({ rowIndex, colIndex })
        }
      }
    })

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })
  }

  revealEmpty({ rowIndex, colIndex }) {
    const neighbors = this.getNeighbors({ rowIndex, colIndex })
    Object.keys(neighbors)
      .filter((neighbor) => neighbors[neighbor] instanceof Cell)
      .forEach((neighbor) => {
        const { rowIndex, colIndex, isBomb, isRevealed, neighborsBombCount } = neighbors[neighbor]
        if (!isRevealed && !isBomb && neighborsBombCount === 0) {
          neighbors[neighbor].reveal()
          this.revealEmpty({ rowIndex, colIndex })
        }
      })
  }

  revealBombs() {
    const { bombCells } = this.GameData
    bombCells.forEach((bombCell) => bombCell.reveal())
  }

  revealAll() {
    const { map } = this.GameData
    map.forEach((row) => {
      row.forEach((cell) => cell.reveal())
    })
  }
}

const onLoad = () => {
  const container = document.querySelector(".container")
  const restart = document.querySelector(".new")

  new Minesweeper({ cols, rows, bombs, container, size })

  restart.addEventListener("click", () => {
    new Minesweeper({ cols, rows, bombs, container, size })
  })
}

window.addEventListener("load", onLoad)
