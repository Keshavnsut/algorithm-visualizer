#include <vector>
#include <queue>
#include <cmath>
#include <limits>
using namespace std;

struct Edge {
    int to;
    int weight;
};

struct Point {
    double x;
    double y;
};

static double heuristic(const Point& a, const Point& b) {
    double dx = a.x - b.x;
    double dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
}

vector<int> aStarPath(
    const vector<vector<Edge>>& graph,
    const vector<Point>& positions,
    int start,
    int target
) {
    int n = static_cast<int>(graph.size());
    const double INF = numeric_limits<double>::infinity();

    vector<double> gScore(n, INF);
    vector<double> fScore(n, INF);
    vector<int> parent(n, -1);

    using OpenNode = pair<double, int>; // {fScore, node}
    priority_queue<OpenNode, vector<OpenNode>, greater<OpenNode>> openSet;

    gScore[start] = 0.0;
    fScore[start] = heuristic(positions[start], positions[target]);
    openSet.push({fScore[start], start});

    while (!openSet.empty()) {
        auto [_, node] = openSet.top();
        openSet.pop();

        if (node == target) break;

        for (const auto& edge : graph[node]) {
            int nxt = edge.to;
            double tentativeG = gScore[node] + edge.weight;

            if (tentativeG < gScore[nxt]) {
                parent[nxt] = node;
                gScore[nxt] = tentativeG;
                fScore[nxt] = tentativeG + heuristic(positions[nxt], positions[target]);
                openSet.push({fScore[nxt], nxt});
            }
        }
    }

    if (parent[target] == -1 && target != start) return {};

    vector<int> path;
    for (int cur = target; cur != -1; cur = parent[cur]) {
        path.push_back(cur);
    }
    reverse(path.begin(), path.end());
    return path;
}
