#include <iostream>
#include <vector>
#include <queue>
#include <cmath>
using namespace std;

struct Node {
    int id;
    double x, y;
};

struct Item {
    int nodeId;
    double priority;
    bool operator>(const Item& other) const {
        return priority > other.priority;
    }
};

double heuristic(const Node& a, const Node& b) {
    double dx = a.x - b.x;
    double dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
}

vector<int> greedyBestFirst(vector<Node>& nodes, vector<vector<int>>& graph, 
                            int start, int goal) {
    priority_queue<Item, vector<Item>, greater<Item>> openSet;
    vector<bool> visited(nodes.size(), false);
    vector<int> parent(nodes.size(), -1);

    openSet.push({start, 0});

    while (!openSet.empty()) {
        int current = openSet.top().nodeId;
        openSet.pop();

        if (current == goal) {
            vector<int> path;
            while (current != -1) {
                path.push_back(current);
                current = parent[current];
            }
            reverse(path.begin(), path.end());
            return path;
        }

        if (visited[current]) continue;
        visited[current] = true;

        for (int neighbor : graph[current]) {
            if (!visited[neighbor]) {
                double h = heuristic(nodes[neighbor], nodes[goal]);
                openSet.push({neighbor, h});
                if (parent[neighbor] == -1) {
                    parent[neighbor] = current;
                }
            }
        }
    }

    return {};
}

int main() {
    vector<Node> nodes = {
        {0, 0, 0},
        {1, 1, 2},
        {2, 2, 1},
        {3, 3, 3},
        {4, 4, 2}
    };

    vector<vector<int>> graph = {
        {1, 2},
        {0, 2, 3},
        {0, 1, 3, 4},
        {1, 2, 4},
        {2, 3}
    };

    vector<int> path = greedyBestFirst(nodes, graph, 0, 4);
    
    cout << "Path: ";
    for (int nodeId : path) {
        cout << nodeId << " ";
    }
    cout << endl;

    return 0;
}
