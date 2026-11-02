import './fonts.css';
import './learning.css';
import {LearningProvider} from './provider';
import {LearningHeader} from './navigation';
export default function Layout({children}:{children:React.ReactNode}){return <div className="learning-area"><LearningProvider><LearningHeader/>{children}</LearningProvider></div>}
