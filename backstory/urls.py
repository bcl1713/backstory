from django.urls import include, path
from .views import health
from .renderers import mermaid_frame
from .isolated_renderers import graphviz_frame, vega_lite_frame

urlpatterns = [path("renderers/vega-lite-frame/", vega_lite_frame, name="vega_lite_frame"), path("renderers/graphviz-frame/", graphviz_frame, name="graphviz_frame"), path("renderers/mermaid-frame/", mermaid_frame, name="mermaid_frame"), path("health/", health, name="health"), path("accounts/", include("accounts.urls")), path("", include("wiki.urls"))]
