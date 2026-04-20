# SCOUT School Safety Dashboard Prototype

## Git Workflow

Use this workflow so we can develop in separate branches and merge more safely.

1. Always start from the latest `main`.

```bash
git checkout main
git pull
```

2. Create a new feature branch from `main`.

```bash
git checkout -b your-branch-name
```

3. Work only on files related to your user story unless the team agrees on a shared change.

4. Before opening a pull request or merging, update your branch with the latest `main`.

```bash
git checkout main
git pull
git checkout your-branch-name
git merge main
```

5. Fix merge conflicts in your own branch before asking others to review or before merging.

6. Do not delete, revert, or overwrite teammates' work unless you have checked with them first.

7. If a change touches another teammate's scope, discuss it in the group before merging.

## Notes

- The safest habit is: `pull main` first, then create or update your feature branch.
- Merge `main` into your branch before merging to `main`, not after.
- Keep commits focused so conflicts are easier to resolve.
