#include <bits/stdc++.h>
using namespace std;

class Solution {
  int dfs(int i, int j, const string& a, const string& b, vector<vector<int>>& memo) {
    if (i == (int)a.size()) return (int)b.size() - j;
    if (j == (int)b.size()) return (int)a.size() - i;
    if (memo[i][j] != -1) return memo[i][j];

    if (a[i] == b[j]) {
      memo[i][j] = dfs(i + 1, j + 1, a, b, memo);
    } else {
      int insertCost = dfs(i, j + 1, a, b, memo);
      int deleteCost = dfs(i + 1, j, a, b, memo);
      int replaceCost = dfs(i + 1, j + 1, a, b, memo);
      memo[i][j] = 1 + min(insertCost, min(deleteCost, replaceCost));
    }

    return memo[i][j];
  }

public:
  int minDistance(string word1, string word2) {
    vector<vector<int>> memo(word1.size(), vector<int>(word2.size(), -1));
    return dfs(0, 0, word1, word2, memo);
  }
};
