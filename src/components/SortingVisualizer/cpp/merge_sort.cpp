#include <vector>
using namespace std;

static void mergeRange(vector<int>& arr, int left, int mid, int right) {
    vector<int> leftPart(arr.begin() + left, arr.begin() + mid + 1);
    vector<int> rightPart(arr.begin() + mid + 1, arr.begin() + right + 1);

    int i = 0;
    int j = 0;
    int k = left;

    while (i < static_cast<int>(leftPart.size()) && j < static_cast<int>(rightPart.size())) {
        if (leftPart[i] <= rightPart[j]) {
            arr[k++] = leftPart[i++];
        } else {
            arr[k++] = rightPart[j++];
        }
    }

    while (i < static_cast<int>(leftPart.size())) {
        arr[k++] = leftPart[i++];
    }

    while (j < static_cast<int>(rightPart.size())) {
        arr[k++] = rightPart[j++];
    }
}

static void mergeSortImpl(vector<int>& arr, int left, int right) {
    if (left >= right) return;

    int mid = left + (right - left) / 2;
    mergeSortImpl(arr, left, mid);
    mergeSortImpl(arr, mid + 1, right);
    mergeRange(arr, left, mid, right);
}

void mergeSort(vector<int>& arr) {
    if (arr.empty()) return;
    mergeSortImpl(arr, 0, static_cast<int>(arr.size()) - 1);
}
