#include <bits/stdc++.h>
using namespace std;

class Solution {
  int dfs(int i, int j, const string& a, const string& b, vector<vector<int>>& memo) {
    if (i == (int)a.size() || j == (int)b.size()) return 0;
    if (memo[i][j] != -1) return memo[i][j];

    if (a[i] == b[j]) {
      memo[i][j] = 1 + dfs(i + 1, j + 1, a, b, memo);
    } else {
      memo[i][j] = max(dfs(i + 1, j, a, b, memo), dfs(i, j + 1, a, b, memo));
    }
    return memo[i][j];
  }

public:
  int longestCommonSubsequence(string text1, string text2) {
    vector<vector<int>> memo(text1.size(), vector<int>(text2.size(), -1));
    return dfs(0, 0, text1, text2, memo);
  }
};
