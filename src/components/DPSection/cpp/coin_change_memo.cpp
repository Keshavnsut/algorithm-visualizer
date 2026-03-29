#include <bits/stdc++.h>
using namespace std;

class Solution {
  int dfs(int amount, const vector<int>& coins, vector<int>& memo) {
    if (amount == 0) return 0;
    if (amount < 0) return 1000000000;
    if (memo[amount] != -1) return memo[amount];

    int best = 1000000000;
    for (int coin : coins) {
      best = min(best, 1 + dfs(amount - coin, coins, memo));
    }
    memo[amount] = best;
    return memo[amount];
  }

public:
  int coinChange(vector<int>& coins, int amount) {
    vector<int> memo(amount + 1, -1);
    int ans = dfs(amount, coins, memo);
    return ans >= 1000000000 ? -1 : ans;
  }
};
