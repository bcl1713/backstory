from django.contrib.auth.views import LoginView, LogoutView


class SignInView(LoginView):
    template_name = "registration/login.html"


class SignOutView(LogoutView):
    http_method_names = ["post", "options"]
