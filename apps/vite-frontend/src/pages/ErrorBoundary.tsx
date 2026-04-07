import {type JSX} from 'react';
import {useRouteError, useNavigate, isRouteErrorResponse} from 'react-router-dom';

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

export function ErrorBoundary(): JSX.Element {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{getErrorMessage(error)}</p>
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
