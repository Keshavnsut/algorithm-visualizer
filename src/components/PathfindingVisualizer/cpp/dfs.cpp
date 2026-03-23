#include <vector>
using namespace std;

struct Edge {
    int to;
    int weight;
};

static bool dfsHelper(
    const vector<vector<Edge>>& graph,
    int node,
    int target,
    vector<bool>& visited,
    vector<int>& parent
) {
    visited[node] = true;
    if (node == target) return true;

    for (const auto& edge : graph[node]) {
        int nxt = edge.to;
        if (!visited[nxt]) {
            parent[nxt] = node;
            if (dfsHelper(graph, nxt, target, visited, parent)) {
                return true;
            }
        }
    }

    return false;
}

vector<int> dfsPath(const vector<vector<Edge>>& graph, int start, int target) {
    int n = static_cast<int>(graph.size());
    vector<bool> visited(n, false);
    vector<int> parent(n, -1);

    if (!dfsHelper(graph, start, target, visited, parent)) {
        return {};
    }

    vector<int> path;
    for (int cur = target; cur != -1; cur = parent[cur]) {
        path.push_back(cur);
    }
    reverse(path.begin(), path.end());
    return path;
}
