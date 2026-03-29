#include <iostream>
#include <vector>
#include <queue>
#include <unordered_set>
#include <unordered_map>
using namespace std;

vector<int> bidirectionalBFS(vector<vector<int>>& graph, int start, int goal) {
    if (start == goal) {
        return {start};
    }

    unordered_set<int> visited_start, visited_goal;
    unordered_map<int, int> parent_start, parent_goal;
    queue<int> q_start, q_goal;

    q_start.push(start);
    q_goal.push(goal);
    visited_start.insert(start);
    visited_goal.insert(goal);
    parent_start[start] = -1;
    parent_goal[goal] = -1;

    while (!q_start.empty() || !q_goal.empty()) {
        // Expand from start side
        if (!q_start.empty()) {
            int curr = q_start.front();
            q_start.pop();

            for (int neighbor : graph[curr]) {
                if (visited_goal.count(neighbor)) {
                    // Found meeting point
                    vector<int> path;
                    int node = neighbor;
                    while (parent_goal[node] != -1) {
                        path.push_back(node);
                        node = parent_goal[node];
                    }
                    path.push_back(goal);
                    reverse(path.begin(), path.end());
                    
                    node = curr;
                    while (parent_start[node] != -1) {
                        path.push_back(node);
                        node = parent_start[node];
                    }
                    path.push_back(start);
                    reverse(path.begin(), path.end());
                    return path;
                }

                if (!visited_start.count(neighbor)) {
                    visited_start.insert(neighbor);
                    parent_start[neighbor] = curr;
                    q_start.push(neighbor);
                }
            }
        }

        // Expand from goal side
        if (!q_goal.empty()) {
            int curr = q_goal.front();
            q_goal.pop();

            for (int neighbor : graph[curr]) {
                if (visited_start.count(neighbor)) {
                    // Found meeting point
                    vector<int> path;
                    int node = neighbor;
                    while (parent_start[node] != -1) {
                        path.push_back(node);
                        node = parent_start[node];
                    }
                    path.push_back(start);
                    reverse(path.begin(), path.end());

                    node = curr;
                    while (parent_goal[node] != -1) {
                        path.push_back(node);
                        node = parent_goal[node];
                    }
                    path.push_back(goal);
                    reverse(path.begin(), path.end());
                    return path;
                }

                if (!visited_goal.count(neighbor)) {
                    visited_goal.insert(neighbor);
                    parent_goal[neighbor] = curr;
                    q_goal.push(neighbor);
                }
            }
        }
    }

    return {};
}

int main() {
    vector<vector<int>> graph = {
        {1, 2},
        {0, 2, 3},
        {0, 1, 3, 4},
        {1, 2, 4},
        {2, 3}
    };

    vector<int> path = bidirectionalBFS(graph, 0, 4);
    
    cout << "Path: ";
    for (int nodeId : path) {
        cout << nodeId << " ";
    }
    cout << endl;

    return 0;
}
