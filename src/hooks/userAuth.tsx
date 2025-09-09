import { useSelector } from "react-redux";
import { RootState } from "../redux/store/store";
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom'
export function AdminWrap(WarperComponent: any) {
    return (props: any) => {
        const user: any = useSelector((state: RootState) => state?.auth?.user);
        const nav = useNavigate()
        useEffect(() => {
            if (user.role !== "admin") {
                alert("You have not an Authrized User ");
                nav("/scanner")
            }
        }, [user])
        if (!user) {
            return <div>Loading...</div>;
        }
        return <WarperComponent {...props} />
    }
}
export const UserWrap=(WarperComponent:any)=>{
    return (props:any)=>{
        const user: any = useSelector((state: RootState) => state?.auth?.user);
        const nav=useNavigate();
        useEffect(()=>{
            if(user.role!=='user' && user.role!=='admin'){
            alert('Please Login First')
            nav('/')
        }
        },[user])
         return <WarperComponent {...props} />
    }
}