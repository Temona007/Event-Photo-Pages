(function () {
  var EPStore = window.EPStore;
  var EPSession = window.EPSession;

  var formLogin = document.getElementById('form-login');
  var formSignup = document.getElementById('form-signup');
  var tabLogin = document.getElementById('tab-login');
  var tabSignup = document.getElementById('tab-signup');

  function showLogin() {
    formLogin.hidden = false;
    formSignup.hidden = true;
    tabLogin.setAttribute('aria-pressed', 'true');
    tabSignup.setAttribute('aria-pressed', 'false');
  }

  function showSignup() {
    formSignup.hidden = false;
    formLogin.hidden = true;
    tabSignup.setAttribute('aria-pressed', 'true');
    tabLogin.setAttribute('aria-pressed', 'false');
  }

  tabLogin.addEventListener('click', showLogin);
  tabSignup.addEventListener('click', showSignup);

  formLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var user = EPStore.login(email, password);
    if (!user) {
      alert('Invalid email or password.');
      return;
    }
    EPSession.setSession(user);
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  });

  formSignup.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('su-name').value;
    var email = document.getElementById('su-email').value;
    var password = document.getElementById('su-password').value;
    var result = EPStore.signup(email, password, name);
    if (result.error) {
      alert(result.error);
      return;
    }
    EPSession.setSession(result.user);
    window.location.href = 'dashboard.html';
  });
})();
