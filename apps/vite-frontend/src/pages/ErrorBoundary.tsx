import {useRouteError, useNavigate} from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <button
        type="button"
        onClick={() => {
          navigate(-1);
        }}
      >
        Go back
      </button>
    </div>
  );
}
