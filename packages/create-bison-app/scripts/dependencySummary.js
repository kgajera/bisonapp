const execa = require("execa");
const core = require("@actions/core");

if (!process.env.GITHUB_STEP_SUMMARY) {
  throw new Error("GITHUB_STEP_SUMMARY is not set");
}

async function createDependencySummary() {
  const dependencies = await getOutdatedDependencies();
  const dependencyNames = Object.keys(dependencies);

  if (dependencyNames.length) {
    await core.summary
      .addHeading('Outdated Dependencies')
      .addTable([
        [
          { data: 'Dependency', header: true },
          { data: 'Current', header: true },
          { data: 'Latest', header: true },
        ],
        ...dependencyNames.map((dep) => [
          `<a href="https://www.npmjs.com/package/${dep}">${dep}</a>`,
          dependencies[dep].current,
          dependencies[dep].latest
        ]),
      ])
      .write();
  } else {
    core.info('All dependencies are up to date');
  }
}

async function getOutdatedDependencies () {
  let output;

  try {
    // "npm outdated" will exit with code 1 (error) if there are no outdated dependencies resulting in an error being thrown
    const { stdout } = await execa('npm', ['outdated --json'], {
      shell: true,
    });

    output = stdout;
  } catch (error) {
    if (error.stderr !== '') {
      console.log(error);
      core.setFailed(`Action failed with error ${error}`);
    } else {
      output = error.stdout;
    }
  }

  return output ? JSON.parse(output) : {};
}

if (require.main === module) {
  createDependencySummary();
}
