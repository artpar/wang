#!/bin/bash

# Wang Syntax Test Runner
# Tests grammar features vs actual implementation

echo "Wang Language Syntax Verification Tests"
echo "========================================"
echo ""

# Check if wang interpreter exists
if ! command -v wang &> /dev/null; then
    echo "ERROR: wang interpreter not found in PATH"
    echo "Please ensure wang is installed and in your PATH"
    exit 1
fi

# Function to run a test file
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo "Running: $test_name"
    echo "File: $test_file"
    echo "----------------------------------------"
    
    # Run the test and capture both stdout and stderr
    if wang "$test_file" 2>&1; then
        echo "✅ Test completed without crash"
    else
        echo "❌ Test crashed with exit code: $?"
    fi
    
    echo ""
    echo "========================================"
    echo ""
}

# Run each test file
echo "Starting test suite..."
echo ""

# Test isolated features
run_test "test/isolated-tests.wang" "Isolated Arrow Functions"
run_test "test/test-objects.wang" "Object Literals"
run_test "test/test-user-failures.wang" "User Reported Failures"

# Run comprehensive test if desired
read -p "Run comprehensive syntax test? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_test "test/syntax-verification.wang" "Comprehensive Syntax Test"
fi

echo "Test suite complete!"
echo ""
echo "Summary:"
echo "- Tests attempt features that the grammar specification supports"
echo "- Failures indicate implementation gaps between grammar and runtime"
echo "- See test-results.md for detailed analysis"