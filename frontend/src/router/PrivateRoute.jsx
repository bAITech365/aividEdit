import { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../provider/AuthProvider";

const PrivateRoute = ({children}) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if(user){
    return children;
  }
  return <Navigate state={ location.pathname} to={'/login'} replace></Navigate>
};

export default PrivateRoute;