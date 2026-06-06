output "app_namespace" {
  value = kubernetes_namespace.app.metadata[0].name
}
output "monitoring_namespace" {
  value = kubernetes_namespace.monitoring.metadata[0].name
}
output "grafana_password" {
  value     = var.grafana_password
  sensitive = true
}