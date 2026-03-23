#include <vector>
#include <queue>
#include <limits>
using namespace std;

struct Edge {
    int to;
    int weight;
};

vector<int> dijkstraShortestPath(const vector<vector<Edge>>& graph, int start, int target) {
    int n = static_cast<int>(graph.size());
    const int INF = numeric_limits<int>::max();

    vector<int> dist(n, INF);
    vector<int> parent(n, -1);

    using NodeState = pair<int, int>; // {distance, node}
    priority_queue<NodeState, vector<NodeState>, greater<NodeState>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [curDist, node] = pq.top();
        pq.pop();

        if (curDist != dist[node]) continue;
        if (node == target) break;

        for (const auto& edge : graph[node]) {
            int nxt = edge.to;
            int newDist = curDist + edge.weight;
            if (newDist < dist[nxt]) {
                dist[nxt] = newDist;
                parent[nxt] = node;
                pq.push({newDist, nxt});
            }
        }
    }

    if (dist[target] == INF) return {};

    vector<int> path;
    for (int cur = target; cur != -1; cur = parent[cur]) {
        path.push_back(cur);
    }
    reverse(path.begin(), path.end());
    return path;
}
