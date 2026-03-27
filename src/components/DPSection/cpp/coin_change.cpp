#include <vector>
#include <algorithm>
#include <limits>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    const int INF = numeric_limits<int>::max() / 2;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;

    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin <= a) {
                dp[a] = min(dp[a], dp[a - coin] + 1);
            }
        }
    }

    return dp[amount] >= INF ? -1 : dp[amount];
}
