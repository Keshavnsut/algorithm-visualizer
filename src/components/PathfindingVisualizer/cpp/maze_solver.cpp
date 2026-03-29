#include <iostream>
#include <vector>
#include <queue>
#include <cstdlib>
#include <ctime>
using namespace std;

struct Cell {
    int x, y;
};

bool isValid(int x, int y, int rows, int cols, vector<vector<int>>& maze) {
    return x >= 0 && x < rows && y >= 0 && y < cols && maze[x][y] == 1;
}

vector<Cell> solveMaze(vector<vector<int>>& maze, int rows, int cols) {
    vector<Cell> path;
    vector<vector<bool>> visited(rows, vector<bool>(cols, false));
    queue<Cell> q;
    vector<vector<Cell>> parent(rows, vector<Cell>(cols, {-1, -1}));

    q.push({0, 0});
    visited[0][0] = true;
    parent[0][0] = {-1, -1};

    int dx[] = {0, 0, 1, -1};
    int dy[] = {1, -1, 0, 0};

    while (!q.empty()) {
        Cell curr = q.front();
        q.pop();

        if (curr.x == rows - 1 && curr.y == cols - 1) {
            // Reconstruct path
            Cell node = {rows - 1, cols - 1};
            while (node.x != -1 && node.y != -1) {
                path.push_back(node);
                Cell p = parent[node.x][node.y];
                node = p;
            }
            reverse(path.begin(), path.end());
            return path;
        }

        for (int i = 0; i < 4; i++) {
            int newX = curr.x + dx[i];
            int newY = curr.y + dy[i];

            if (isValid(newX, newY, rows, cols, maze) && !visited[newX][newY]) {
                visited[newX][newY] = true;
                parent[newX][newY] = curr;
                q.push({newX, newY});
            }
        }
    }

    return path;
}

void generateMaze(vector<vector<int>>& maze, int rows, int cols) {
    // Initialize all cells as walls
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            maze[i][j] = 0;
        }
    }

    // Create simple paths in maze
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if ((i + j) % 2 == 0) {
                maze[i][j] = 1;
            }
        }
    }
}

int main() {
    srand(time(0));
    int rows = 21, cols = 21;
    vector<vector<int>> maze(rows, vector<int>(cols));

    generateMaze(maze, rows, cols);
    vector<Cell> path = solveMaze(maze, rows, cols);

    cout << "Maze solved with path length: " << path.size() << endl;
    for (auto cell : path) {
        cout << "(" << cell.x << "," << cell.y << ") ";
    }
    cout << endl;

    return 0;
}
