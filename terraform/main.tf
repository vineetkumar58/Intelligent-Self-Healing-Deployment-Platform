terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

provider "helm" {
  kubernetes {
    config_path    = "~/.kube/config"
    config_context = "minikube"
  }
}

# ─── Simulated Network Infrastructure ───────────────────────────────────────
# In production this would provision AWS VPC, Subnets, Security Groups
# For local development we simulate using Kubernetes NetworkPolicies

resource "kubernetes_namespace" "vpc_simulation" {
  metadata {
    name = "vpc-network"
    labels = {
      project     = var.project_name
      managed-by  = "terraform"
      tier        = "networking"
    }
  }
}

# Simulated VPC - Development Network Policy
resource "kubernetes_network_policy" "vpc_dev" {
  metadata {
    name      = "vpc-development"
    namespace = var.app_namespace
  }
  spec {
    pod_selector {}
    ingress {
      from {
        namespace_selector {
          match_labels = {
            name = var.app_namespace
          }
        }
      }
    }
    policy_types = ["Ingress"]
  }
  depends_on = [kubernetes_namespace.app]
}

# Simulated Security Group - Allow internal traffic
resource "kubernetes_network_policy" "security_group_internal" {
  metadata {
    name      = "security-group-internal"
    namespace = var.app_namespace
  }
  spec {
    pod_selector {}
    ingress {
      from {
        pod_selector {}
      }
      ports {
        port     = "5000"
        protocol = "TCP"
      }
      ports {
        port     = "80"
        protocol = "TCP"
      }
    }
    policy_types = ["Ingress"]
  }
  depends_on = [kubernetes_namespace.app]
}

# Simulated Security Group - Allow monitoring
resource "kubernetes_network_policy" "security_group_monitoring" {
  metadata {
    name      = "security-group-monitoring"
    namespace = var.app_namespace
  }
  spec {
    pod_selector {}
    ingress {
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = "monitoring"
          }
        }
      }
      ports {
        port     = "5000"
        protocol = "TCP"
      }
    }
    policy_types = ["Ingress"]
  }
  depends_on = [kubernetes_namespace.app]
}

# ─── Namespaces ──────────────────────────────────────────────────────────────

resource "kubernetes_namespace" "app" {
  metadata {
    name = var.app_namespace
    labels = {
      project     = var.project_name
      managed-by  = "terraform"
      environment = var.environment
    }
  }
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      project    = var.project_name
      managed-by = "terraform"
    }
  }
}

resource "kubernetes_namespace" "staging" {
  metadata {
    name = "staging"
    labels = {
      project     = var.project_name
      managed-by  = "terraform"
      environment = "staging"
    }
  }
}

# ─── ConfigMap ───────────────────────────────────────────────────────────────

resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.app.metadata[0].name
  }
  data = {
    APP_VERSION  = var.app_version
    ENVIRONMENT  = var.environment
    LOG_LEVEL    = "INFO"
    CLUSTER_NAME = var.project_name
  }
}

# ─── Prometheus + Grafana via Helm ───────────────────────────────────────────

resource "helm_release" "prometheus_stack" {
  name       = "monitoring"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "55.5.0"

  set {
    name  = "grafana.adminPassword"
    value = var.grafana_password
  }
  set {
    name  = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }
  set {
    name  = "grafana.service.type"
    value = "NodePort"
  }

  timeout = 600
}