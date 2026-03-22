#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int rob(vector<int>& nums) {
        int n = static_cast<int>(nums.size());
        if (n == 0) return 0;

        vector<int> dp(n + 1, 0);
        dp[0] = 0;
        dp[1] = nums[0];

        for (int i = 2; i <= n; i++) {
            dp[i] = max(dp[i - 1], nums[i - 1] + dp[i - 2]);
        }

        return dp[n];
    }
};

int main() {
    Solution sol;
    vector<int> nums = {2, 7, 9, 3, 1};
    cout << "Max loot = " << sol.rob(nums) << endl;
    return 0;
}
