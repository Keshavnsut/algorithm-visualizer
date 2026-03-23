#include <vector>
#include <queue>
using namespace std;

struct Edge {
    int to;
    int weight;
};

vector<int> bfsShortestPath(const vector<vector<Edge>>& graph, int start, int target) {
    int n = static_cast<int>(graph.size());
    vector<int> parent(n, -1);
    vector<bool> visited(n, false);
    queue<int> q;

    visited[start] = true;
    q.push(start);

    while (!q.empty()) {
        int node = q.front();
        q.pop();

        if (node == target) break;

        for (const auto& edge : graph[node]) {
            int nxt = edge.to;
            if (!visited[nxt]) {
                visited[nxt] = true;
                parent[nxt] = node;
                q.push(nxt);
            }
        }
    }

    if (!visited[target]) return {};

    vector<int> path;
    for (int cur = target; cur != -1; cur = parent[cur]) {
        path.push_back(cur);
    }
    reverse(path.begin(), path.end());
    return path;
}
