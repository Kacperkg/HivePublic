# Contributing

Thanks for improving The Hive.

1. Open an issue for behavior or visual changes before implementation. Design parity is intentional.
2. Create a focused branch and keep changes scoped.
3. Add meaningful tests for changed behavior and error paths.
4. Run `./bin/lint.sh` and `./bin/test.sh`.
5. Describe API or migration changes explicitly in the pull request.

Never commit credentials, `.env` files, generated builds, personal data, or assets without documented redistribution rights. Existing deployed migrations are immutable; add a new ordered migration instead.
