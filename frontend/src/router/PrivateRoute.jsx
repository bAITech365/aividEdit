import { useContext } from "react";
import { Navigate, useLocation } from "react-router";

const PrivateRoute = ({children}) => {
    const user = JSON.parse(localStorage.getItem('googleCredentials'));
  const location = useLocation();

  if(user){
    return children;
  }
  return <Navigate state={ location.pathname} to={'/login'} replace></Navigate>
};

export default PrivateRoute;