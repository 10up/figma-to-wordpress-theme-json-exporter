# Contributing and Maintaining

First, thank you for taking the time to contribute!

The following is a set of guidelines for contributors as well as information and instructions around our maintenance process.  The two are closely tied together in terms of how we all work together and set expectations, so while you may not need to know everything in here to submit an issue or pull request, it's best to keep them in the same document.

## Ways to contribute

Contributing isn't just writing code - it's anything that improves the project.  All contributions are managed right here on GitHub.  Here are some ways you can help:

### Reporting bugs

If you're running into an issue, please take a look through [existing issues](https://github.com/10up/figma-to-wordpress-theme-json-exporter/issues) and [open a new one](https://github.com/10up/figma-to-wordpress-theme-json-exporter/issues/new) if needed.  If you're able, include steps to reproduce, environment information, and screenshots/screencasts as relevant.

### Suggesting enhancements

New features and enhancements are also managed via [issues](https://github.com/10up/figma-to-wordpress-theme-json-exporter/issues).

### Pull requests

Pull requests represent a proposed solution to a specified problem.  They should always reference an issue that describes the problem and contains discussion about the problem itself.  Discussion on pull requests should be limited to the pull request itself, i.e. code review.

For more on how 10up writes and manages code, check out our [10up Engineering Best Practices](https://10up.github.io/Engineering-Best-Practices/).

#### Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management. **All pull requests must include a changeset** unless the changes don't affect the published package (e.g., documentation updates, test changes, or CI configuration).

To add a changeset:

1. Run `npm run changeset` in your local development environment
2. Select the package to bump (for this single-package repo, select the main package)
3. Choose the appropriate change type:
   - **patch**: Bug fixes, documentation updates, internal changes
   - **minor**: New features, enhancements that don't break existing functionality
   - **major**: Breaking changes that require users to update their code
4. Write a clear summary of your changes
5. Commit the generated changeset file with your other changes

The CI will automatically check for changesets and fail if one is missing from a pull request that should include one.

### Testing

Helping to test an open source project and provide feedback on success or failure of those tests is also a helpful contribution.  You can find details on the Critical Flows and Test Cases in the respective GitHub Wiki as well as details on our overall approach to [Critical Flows and Test Cases in our Open Source Best Practices](https://10up.github.io/Open-Source-Best-Practices/testing/#critial-flows).  Submitting the results of testing via our Critical Flows as a comment on a Pull Request of a specific feature or as an Issue when testing the entire project is the best approach for providing testing results.

## Workflow

The `develop` branch is the development branch which means it contains the next version to be released.  `main` contains the stable development version.  Always work on the `develop` branch and open up PRs against `develop`.

## Release instructions

1. Branch: Starting from `develop`, cut a release branch named `release/X.Y.Z` for your changes.
2. Version bump: Bump the version number in `package.json`, `package-lock.json`, and any other relevant files if it does not already reflect the version being released.
3. Changelog: Add/update the changelog in `CHANGELOG.md`.
4. Props: update `CREDITS.md` file with any new contributors, and confirm maintainers are accurate.
5. New files: Check to be sure any new files/paths that are unnecessary in the production version are included in `.gitattributes` or `.distignore`.
6. Readme updates: Make any other readme changes as necessary in the `README.md` file.
7. Merge: Make a non-fast-forward merge from your release branch to `develop` (or merge the pull request), then do the same for `develop` into `main`, ensuring you pull the most recent changes into `develop` first (`git checkout develop && git pull origin develop && git checkout main && git merge --no-ff develop`). `main` contains the stable development version.
8. Push: Push your `main` branch to GitHub (e.g. `git push origin main`).
9. Compare `main` to `develop` to ensure no additional changes were missed. Visit [REPOSITORY_URL]/compare/main...develop
10. Test the pre-release ZIP locally by downloading it from the **Build Plugin** action artifact and installing it locally.  Ensure this zip has all the files we expect, that it installs and activates correctly and that all basic functionality is working.
11. Either perform Regression Testing utilizing the available [Critical Flows](https://10up.github.io/Open-Source-Best-Practices/testing/#critical-flows) and Test Cases or if [end-to-end tests](https://10up.github.io/Open-Source-Best-Practices/testing/#e2e-testing) cover a significant portion of those Critical Flows then run e2e tests.  Only proceed if everything tests successfully.
12. Release: Create a [new release](https://github.com/10up/figma-to-wordpress-theme-json-exporter/releases/new), naming the tag and the release with the new version number, and targeting the `main` branch. Paste the changelog from `CHANGELOG.md` into the body of the release and include a link to the closed issues on the [milestone](https://github.com/10up/figma-to-wordpress-theme-json-exporter/milestone/#?closed=1).
13. Close milestone: Edit the [milestone](https://github.com/10up/figma-to-wordpress-theme-json-exporter/milestone/#) with release date (in the `Due date (optional)` field) and link to GitHub release (in the `Description` field), then close the milestone.
14. Punt incomplete items: If any open issues or PRs which were milestoned for `X.Y.Z` do not make it into the release, update their milestone to `X.Y.Z+1`, `X.Y+1.0`, `X+1.0.0` or `Future Release`.

### What to do if things go wrong

If you run into issues during the release process and things have NOT fully deployed to WordPress.org / npm / whatever external-to-GitHub location that we might be publishing to, then the best thing to do will be to delete any Tag (e.g., https://github.com/10up/figma-to-wordpress-theme-json-exporter/releases/tag/TAGNAME) or Release that's been created, research what's wrong, and once things are resolved work on re-tagging and re-releasing on GitHub and publishing externally where needed.

If you run into issues during the release process and things HAVE deployed to WordPress.org / npm / whatever external-to-GitHub location that we might be publishing to, then the best thing to do will be to research what's wrong and once things are resolved work on a patch release and tag on GitHub and publishing externally where needed.  At the top of the changelog / release notes it's best to note that its a hotfix to resolve whatever issues were found after the previous release.

Note: The zip file is automatically generated by GitHub at the time of every Release with the name that matches the Tag (e.g., https://github.com/10up/figma-to-wordpress-theme-json-exporter/releases/tag/TAGNAME) or Release that's been created, research what's wrong, and once things are resolved work on re-tagging and re-releasing on GitHub and publishing externally by running the above commands.
