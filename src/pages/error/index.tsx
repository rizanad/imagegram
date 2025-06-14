const Error = () => {
  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <h1>404</h1>
      <p>Page not found</p>
      <p>Sorry, the page you are looking for does not exist.</p>{" "}
      <p>
        Go back to the <a href="/">home page</a>.
      </p>
    </div>
  );
};

export default Error;
