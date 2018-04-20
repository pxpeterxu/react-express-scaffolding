const usernameRegex = /^\w[\w-]*\w$/;
const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

/**
 * Validate a newly-created user account, putting errors in each
 * key if there is an error
 * @param user   user object to validate
 * @return null if valid, object with { [field]: [errorMessage1, errorMessage2] } if not
 */
function validateUser(user) {
  const errors = {};
  if (!user.username) {
    errors.username = 'Please enter a username.';
  } else if (!usernameRegex.test(user.username)) {
    errors.username =
      'Your username must only contain numbers, letters, and dashes (-) and be at least 2 characters long';
  }

  if (!user.password) {
    errors.password = 'Please enter a password.';
  }
  if (!user.email) {
    errors.email = 'Please enter your email address.';
  } else if (!emailRegex.test(user.email)) {
    errors.email = "The email address doesn't look valid. Please try again.";
  }

  return errors;
}

const exported = {
  user: validateUser,
};

export default exported;
export { validateUser as user };
