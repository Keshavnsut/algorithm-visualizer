#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int longestCommonSubsequence(const string& a, const string& b) {
    int n = static_cast<int>(a.size());
    int m = static_cast<int>(b.size());

    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i - 1] == b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[n][m];
}
