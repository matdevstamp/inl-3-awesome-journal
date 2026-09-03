import json
import os
import subprocess
from typing import ClassVar
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


class GitHubError(RuntimeError):
    """Raised when GitHub rejects an API request."""


class GitHubClient:
    def __init__(self, repository=None, token=None):
        self.repository = repository or os.getenv(
            "GITHUB_REPOSITORY", "matdevstamp/inl-3-awesome-journal"
        )
        self.token = token or os.getenv("GITHUB_TOKEN")
        if not self.token:
            self.token = self._token_from_gh_cli()
        if not self.token:
            raise GitHubError("Set GITHUB_TOKEN or run 'gh auth login' first.")
        self.api_url = f"https://api.github.com/repos/{self.repository}"
        self.graphql_url = "https://api.github.com/graphql"

    @staticmethod
    def _token_from_gh_cli():
        try:
            result = subprocess.run(
                ["gh", "auth", "token"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        return None

    def request(self, method, path, payload=None, base_url=None):
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(
            f"{base_url or self.api_url}{path}",
            data=data,
            method=method,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {self.token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
        )
        try:
            with urlopen(request) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise GitHubError(f"GitHub API returned {error.code}: {detail}") from error

    def graphql(self, query, variables=None):
        result = self.request(
            "POST",
            "",
            {"query": query, "variables": variables or {}},
            base_url=self.graphql_url,
        )
        if result.get("errors"):
            messages = "; ".join(
                error.get("message", "Unknown error") for error in result["errors"]
            )
            raise GitHubError(f"GitHub GraphQL error: {messages}")
        return result.get("data", {})

    def issues(self, state="open"):
        return self.request("GET", f"/issues?state={quote(state)}&per_page=100")

    def issue(self, number):
        return self.request("GET", f"/issues/{number}")

    def create_issue(self, title, body="", labels=None, assignee=None):
        payload = {"title": title, "body": body, "labels": labels or []}
        if assignee:
            payload["assignees"] = [assignee]
        return self.request("POST", "/issues", payload)

    def update_issue(self, number, **changes):
        return self.request("PATCH", f"/issues/{number}", changes)

    def comment(self, number, body):
        return self.request("POST", f"/issues/{number}/comments", {"body": body})

    def pull_requests(self, state="open"):
        return self.request("GET", f"/pulls?state={quote(state)}&per_page=100")

    def add_dependency(self, issue_number, blocking_issue_id):
        """Link an issue as blocked by another issue (native GitHub dependency).

        ``blocking_issue_id`` is the numeric ``id`` of the blocking issue,
        not its number. Adding an existing relationship is rejected by GitHub
        (422), so callers should check list_dependencies() first.
        """
        return self.request(
            "POST",
            f"/issues/{issue_number}/dependencies/blocked_by",
            {"issue_id": blocking_issue_id},
        )

    def list_dependencies(self, issue_number):
        """Return the issues a given issue is blocked by."""
        return self.request("GET", f"/issues/{issue_number}/dependencies/blocked_by")

    def remove_dependency(self, issue_number, blocking_issue_id):
        """Remove a 'blocked by' relationship from an issue."""
        return self.request(
            "DELETE",
            f"/issues/{issue_number}/dependencies/blocked_by",
            {"issue_id": blocking_issue_id},
        )

    def create_label(self, name, color, description):
        return self.request(
            "POST",
            "/labels",
            {"name": name, "color": color, "description": description},
        )

    def delete_label(self, name):
        return self.request("DELETE", f"/labels/{quote(name, safe='')}")

    def project_overview(self):
        owner, name = self.repository.split("/", 1)
        query = """
        query($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
                projectsV2(first: 20) {
                    nodes {
                        id number title url
                        fields(first: 30) {
                            nodes {
                                ... on ProjectV2FieldCommon { id name }
                                ... on ProjectV2SingleSelectField { id name options { id name } }
                            }
                        }
                        items(first: 100) {
                            nodes {
                                content {
                                    ... on Issue { number title state url }
                                    ... on PullRequest { number title state url }
                                }
                                fieldValues(first: 30) {
                                    nodes {
                                        ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } }
                                        ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2FieldCommon { name } } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        """
        return self.graphql(query, {"owner": owner, "name": name})

    def _get_first_project(self):
        """Return the first ProjectsV2 node for this repository."""
        owner, name = self.repository.split("/", 1)
        query = """
        query($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
                projectsV2(first: 1) {
                    nodes { id title }
                }
            }
        }
        """
        data = self.graphql(query, {"owner": owner, "name": name})
        projects = data.get("repository", {}).get("projectsV2", {}).get("nodes", [])
        if not projects:
            raise GitHubError("No GitHub Project found. Create one at github.com/projects.")
        return projects[0]

    def _get_project_item_id(self, project_id, issue_number):
        """Find the project item node ID for a given issue number."""
        query = """
        query($issue_number: Int!, $repo_name: String!, $owner: String!) {
            repository(owner: $owner, name: $repo_name) {
                issue(number: $issue_number) {
                    projectItems(first: 10) {
                        nodes {
                            id
                            project { id }
                        }
                    }
                }
            }
        }
        """
        owner, name = self.repository.split("/", 1)
        data = self.graphql(
            query,
            {
                "issue_number": issue_number,
                "repo_name": name,
                "owner": owner,
            },
        )
        items = data.get("repository", {}).get("issue", {}).get("projectItems", {}).get("nodes", [])
        for item in items:
            if item["project"]["id"] == project_id:
                return item["id"]
        return None

    def set_project_single_select(self, project_id, item_id, field_id, option_id):
        """Set a single-select project field value."""
        mutation = """
        mutation($project_id: ID!, $item_id: ID!, $field_id: ID!, $option_id: String!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $project_id
                itemId: $item_id
                fieldId: $field_id
                value: { singleSelectOptionId: $option_id }
            }) {
                projectV2Item { id }
            }
        }
        """
        return self.graphql(
            mutation,
            {
                "project_id": project_id,
                "item_id": item_id,
                "field_id": field_id,
                "option_id": option_id,
            },
        )

    def set_project_number(self, project_id, item_id, field_id, number_value):
        """Set a number project field value."""
        mutation = """
        mutation($project_id: ID!, $item_id: ID!, $field_id: ID!, $number: Float!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $project_id
                itemId: $item_id
                fieldId: $field_id
                value: { number: $number }
            }) {
                projectV2Item { id }
            }
        }
        """
        return self.graphql(
            mutation,
            {
                "project_id": project_id,
                "item_id": item_id,
                "field_id": field_id,
                "number": float(number_value),
            },
        )

    def set_project_date(self, project_id, item_id, field_id, date_str):
        """Set a date project field value (YYYY-MM-DD)."""
        mutation = """
        mutation($project_id: ID!, $item_id: ID!, $field_id: ID!, $date: Date!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $project_id
                itemId: $item_id
                fieldId: $field_id
                value: { date: $date }
            }) {
                projectV2Item { id }
            }
        }
        """
        return self.graphql(
            mutation,
            {
                "project_id": project_id,
                "item_id": item_id,
                "field_id": field_id,
                "date": date_str,
            },
        )

    # Field names that accept date values (not single-select)
    _DATE_FIELDS: ClassVar[set[str]] = {"Start date", "Target date"}
    # Field names that accept number values (not single-select)
    _NUMBER_FIELDS: ClassVar[set[str]] = {"Estimate"}

    def stamp_project_fields(self, issue_number, fields_dict):
        """Set multiple project custom fields for an issue.

        ``fields_dict`` maps field names to values, e.g.::

            {
                "Priority": "P0",
                "Gate": "1-Decisions",
                "Status": "Backlog",
                "Target date": "2026-09-04",
            }

        Single-select fields use option names; date fields use ISO strings.
        The project, item, and field IDs are resolved automatically.
        """
        project = self._get_first_project()
        project_id = project["id"]
        item_id = self._get_project_item_id(project_id, issue_number)
        if not item_id:
            raise GitHubError(
                f"Issue #{issue_number} is not in the project. Add it to the project board first."
            )
        # Fetch field IDs and option IDs
        query = """
        query($project_id: ID!) {
            node(id: $project_id) {
                ... on ProjectV2 {
                    fields(first: 30) {
                        nodes {
                            ... on ProjectV2SingleSelectField {
                                id name
                                options { id name }
                            }
                            ... on ProjectV2Field {
                                id name
                            }
                        }
                    }
                }
            }
        }
        """
        data = self.graphql(query, {"project_id": project_id})
        field_map = {}
        for field in data["node"]["fields"]["nodes"]:
            field_map[field["name"]] = {
                "id": field["id"],
                "options": {opt["name"]: opt["id"] for opt in field.get("options", [])},
            }
        for field_name, value in fields_dict.items():
            if field_name not in field_map:
                raise GitHubError(f"Unknown project field: {field_name}")
            field_info = field_map[field_name]
            if field_name in self._DATE_FIELDS:
                self.set_project_date(project_id, item_id, field_info["id"], value)
            elif field_name in self._NUMBER_FIELDS:
                self.set_project_number(project_id, item_id, field_info["id"], value)
            else:
                if value not in field_info["options"]:
                    raise GitHubError(
                        f"Unknown option '{value}' for field '{field_name}'. "
                        f"Valid options: {', '.join(field_info['options'].keys())}"
                    )
                self.set_project_single_select(
                    project_id,
                    item_id,
                    field_info["id"],
                    field_info["options"][value],
                )
