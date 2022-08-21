import type { NextPage } from 'next/types';
import { useRouter } from 'next/router';
import { Form, Formik } from 'formik';
import axios from 'axios';
import useSWRMutation from 'swr/mutation';
import { useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

const Register: NextPage = () => {
  const { push } = useRouter();

  const fetcher = (url: string, { arg }: { arg: any }) =>
    axios.post(url, arg).then((res) => res.data);

  const {
    data: registered,
    error: registeredError,
    trigger: registeredTrigger,
  } = useSWRMutation('/api/registration', fetcher);
  const {
    data: verified,
    error: verifiedError,
    trigger: verifiedTrigger,
  } = useSWRMutation('/api/verification', fetcher);

  const initialValues = {
    username: '',
  };

  const handleSubmit = async (values: { username: string }) => {
    registeredTrigger(values);
  };

  useEffect(() => {
    (async () => {
      if (registered) {
        const credential = await startRegistration(registered);

        verifiedTrigger({ username: registered.username, credential });
      }
    })();
  }, [registered]);

  useEffect(() => {
    if (verified) {
      push('login');
    }
  }, [verified]);

  return (
    <div>
      <h2 className="text-2xl">Register</h2>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleBlur, handleChange }) => (
          <Form>
            <label htmlFor="username">Username</label>
            <input
              name="username"
              type="input"
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <button type="submit">Register</button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Register;
