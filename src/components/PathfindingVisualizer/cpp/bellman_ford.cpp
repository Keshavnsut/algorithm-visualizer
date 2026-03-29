#include <iostream>
#include <vector>
#include <climits>
using namespace std;

struct Edge {
    int u, v, weight;
};

int bellmanFord(int vertices, vector<Edge>& edges, int src, int dest) {
    vector<int> dist(vertices, INT_MAX);
    dist[src] = 0;

    // Relax edges V-1 times
    for (int i = 0; i < vertices - 1; i++) {
        for (auto& edge : edges) {
            if (dist[edge.u] != INT_MAX && 
                dist[edge.u] + edge.weight < dist[edge.v]) {
                dist[edge.v] = dist[edge.u] + edge.weight;
            }
        }
    }

    // Check for negative-weight cycles
    for (auto& edge : edges) {
        if (dist[edge.u] != INT_MAX && 
            dist[edge.u] + edge.weight < dist[edge.v]) {
            return -1; // Negative cycle detected
        }
    }

    return dist[dest];
}

int main() {
    int vertices = 6;
    vector<Edge> edges = {
        {0, 1, 4},
        {0, 2, 2},
        {1, 3, 5},
        {2, 3, 8},
        {2, 4, 10},
        {3, 4, -4}
    };

    int shortestPath = bellmanFord(vertices, edges, 0, 4);
    
    if (shortestPath == -1) {
        cout << "Negative cycle detected!" << endl;
    } else {
        cout << "Shortest path from 0 to 4: " << shortestPath << endl;
    }

    return 0;
}
