import React, { useContext, useState, useEffect, useRef } from 'react'
import { assets } from "../assets/assets";
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {

  const { backendUrl } = useContext(AppContent)
  axios.defaults.withCredentials = true;

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [isOtpSubmited, setIsOtpSubmited] = useState(false)
  const [timer, setTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([])

  
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text');
    const pasteArray = paste.split('').slice(0, 6);
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    })
  }

 
  const onSubmitEmail = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email })
      if (data.success) {
        toast.success(data.message)
        setIsEmailSent(true)
        setTimer(30); 
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const resendOtp = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email });
      if (data.success) {
        toast.success("New OTP sent!");
        setTimer(30);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmitOTP = async (e) => {
    e.preventDefault()
    const otpArray = inputRefs.current.map(e => e.value)
    const combinedOtp = otpArray.join('')

    if (combinedOtp.length < 6) {
      return toast.error("Please enter 6 digits")
    }

    setOtp(combinedOtp)
    setIsOtpSubmited(true) 
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        backendUrl + '/api/auth/reset-password',
        { email, otp, newPassword }
      );

      if (data.success) {
        toast.success(data.message);
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400'>
      <img onClick={() => navigate('/')} src={assets.logo} alt="Logo" className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer" />

      {/* Form 1: Enter Email */}
      {!isEmailSent &&
        <form onSubmit={onSubmitEmail} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset Password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter your registered email address</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.mail_icon} alt='' className='w-3 h-3' />
            <input type='email' placeholder='Email Id' className='bg-transparent outline-none text-white w-full'
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3'>Send OTP</button>
        </form>
      }

      {isEmailSent && !isOtpSubmited &&
        <form onSubmit={onSubmitOTP} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Enter OTP</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter the code sent to {email}</p>
          <div className='flex justify-between mb-8' onPaste={handlePaste}>
            {Array(6).fill(0).map((_, index) => (
              <input type='text' maxLength='1' key={index} required
                className='w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md outline-none focus:border-indigo-500 border border-transparent'
                ref={e => inputRefs.current[index] = e}
                onInput={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Verify OTP</button>

          <div className='text-center mt-6'>
            {timer > 0 ? (
              <p className='text-gray-400'>Resend in <span className='text-white font-bold'>{timer}s</span></p>
            ) : (
              <p onClick={resendOtp} className={`text-indigo-400 cursor-pointer hover:underline ${isResending ? 'opacity-50' : ''}`}>
                {isResending ? 'Sending...' : 'Resend OTP'}
              </p>
            )}
          </div>
        </form>
      }

      {isEmailSent && isOtpSubmited &&
        <form onSubmit={onSubmitNewPassword} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>New Password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter your new password</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <img src={assets.lock_icon} alt='' className='w-3 h-3' />
            <input type='password' placeholder='New Password' className='bg-transparent outline-none text-white w-full'
              value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full mt-3'>Reset Password</button>
        </form>
      }
    </div>
  )
}

export default ResetPassword