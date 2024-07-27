# Grafana Resources Exporter

The resources exporter is a Grafana App Plugin that allows users to export resources from their instance or Grafana Cloud account as Terraform, Grizzly or Crossplane resource definitions.

## Terraform Config Generation

The plugin generates three Terraform [Grafana provider](https://registry.terraform.io/providers/grafana/grafana/latest) files:

* `provider.tf`: This file contains the `terraform {}` block that installs the provider as well as the `provider "grafana"` block that configures the Grafana provider.
* `resources.tf`: The Grafana provider resources that were generated.
* `imports.tf`: `import {}` blocks that map the Grafana resources with their unique identifier.

These files can be downloaded and used right away, after putting credentials in the `provider.tf` file. 

When a `terraform plan` is run on the files, Terraform should show no changes, only imported resources. On a `terraform apply`, the resources will be added to the state and the `import {}` blocks can be removed.

## Grizzly Resources

Generates resources in the [Grizzly format](https://github.com/grafana/grizzly)

The plugin pulls resources the same way that the `grr pull` command does. The files can be applied with the `grr apply` command.

## Crossplane Resources

Generates resources for the Crossplane [Grafana provider](https://marketplace.upbound.io/providers/grafana/provider-grafana)

After writing the secret that is referred in the `provider.yaml` file, the resources can be applied in a Kubernetes cluster with the Grafana provider installed, though it may be best to rework the resources into compositions.

## Maturity

> _The code in this plugin should be considered experimental. Documentation is only
available alongside the code. It comes with no support, but we are keen to receive
feedback on the product and suggestions on how to improve it, though we cannot commit
to resolution of any particular issue. No SLAs are available. It is not meant to be used
in production environments, and the risks are unknown/high._

Grafana Labs defines experimental features as follows:

> Projects and features in the Experimental stage are supported only by the Engineering
teams; on-call support is not available. Documentation is either limited or not provided
outside of code comments. No SLA is provided.
>
> Experimental projects or features are primarily intended for open source engineers who
want to participate in ensuring systems stability, and to gain consensus and approval
for open source governance projects.
>
> Projects and features in the Experimental phase are not meant to be used in production
environments, and the risks are unknown/high.

## Developing

### TL;DR

```bash
$ npm install
$ npm run dev # watches and rebuilds the frontend
$ npm run server # starts a Grafana instance in docker, with the plugin enabled
```


### Backend

1. Update [Grafana plugin SDK for Go](https://grafana.com/developers/plugin-tools/introduction/grafana-plugin-sdk-for-go) dependency to the latest minor version:

   ```bash
   go get -u github.com/grafana/grafana-plugin-sdk-go
   go mod tidy
   ```

2. Build backend plugin binaries for Linux, Windows and Darwin:

   ```bash
   mage -v
   ```

3. List all available Mage targets for additional commands:

   ```bash
   mage -l
   ```

### Frontend

1. Install dependencies

   ```bash
   npm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   npm run dev
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   npm run test

   # Exits after running all the tests
   npm run test:ci
   ```

5. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   npm run server
   ```

6. Run the E2E tests (using Cypress)

   ```bash
   # Spins up a Grafana instance first that we tests against
   npm run server

   # Starts the tests
   npm run e2e
   ```

7. Run the linter

   ```bash
   npm run lint

   # or

   npm run lint:fix
   ```
