'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLogin, IconMail, IconLock } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { login } from '@/actions/auth';
import { showError, showSuccess } from '@/utils/notifications';

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Enforce dark mode style
  const isDark = true;

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : 'Geçerli bir email giriniz',
      password: (value) =>
        value.length >= 3 ? null : 'Şifre en az 3 karakter olmalıdır',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    try {
      const result = await login(values);

      if (result.error) {
        showError(result.error);
        // Trigger shake animation on error
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        showSuccess('Giriş başarılı!');
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      showError('Giriş yapılırken bir hata oluştu');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #1a1b1e 0%, #25262b 50%, #2c2e33 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'rgba(102, 126, 234, 0.15)',
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'rgba(118, 75, 162, 0.15)',
          filter: 'blur(60px)',
        }}
      />

      <Container size={420} style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and Title */}
          <Stack align="center" gap="md" mb="xl">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.2))',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(102,126,234,0.4)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                }}
              >
                <IconLogin size={40} color="#667eea" stroke={1.5} />
              </Box>
            </motion.div>
            <Title
              order={1}
              style={{
                color: '#c1c2c5',
                textAlign: 'center',
                fontSize: 32,
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              Dans Okulu
            </Title>
            <Text
              size="lg"
              style={{
                color: '#909296',
                textAlign: 'center',
                textShadow: '0 1px 5px rgba(0,0,0,0.3)',
              }}
            >
              Yönetim Paneli
            </Text>
          </Stack>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: shake ? [1, 1.02, 0.98, 1.02, 1] : 1,
            x: shake ? [0, -10, 10, -10, 10, 0] : 0,
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            radius="lg"
            p="xl"
            style={{
              background: 'rgba(37, 38, 43, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            }}
          >
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <TextInput
                    label="Email"
                    placeholder="Email adresinizi girin"
                    leftSection={<IconMail size={18} color="#909296" />}
                    size="md"
                    {...form.getInputProps('email')}
                    styles={{
                      label: {
                        color: '#c1c2c5',
                        fontWeight: 600,
                        marginBottom: 8,
                      },
                      input: {
                        background: 'rgba(44, 46, 51, 0.5)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        color: '#c1c2c5',
                        '::placeholder': {
                          color: 'rgba(144, 146, 150, 0.6)',
                        },
                        '&:focus': {
                          background: 'rgba(44, 46, 51, 0.7)',
                          borderColor: 'rgba(102, 126, 234, 0.5)',
                        },
                      },
                      error: {
                        color: '#fff',
                        background: 'rgba(255, 0, 0, 0.3)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        marginTop: 4,
                      },
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <PasswordInput
                    label="Şifre"
                    placeholder="Şifrenizi girin"
                    leftSection={<IconLock size={18} color="#909296" />}
                    size="md"
                    {...form.getInputProps('password')}
                    styles={{
                      label: {
                        color: '#c1c2c5',
                        fontWeight: 600,
                        marginBottom: 8,
                      },
                      input: {
                        background: 'rgba(44, 46, 51, 0.5)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        color: '#c1c2c5',
                        '::placeholder': {
                          color: 'rgba(144, 146, 150, 0.6)',
                        },
                        '&:focus': {
                          background: 'rgba(44, 46, 51, 0.7)',
                          borderColor: 'rgba(102, 126, 234, 0.5)',
                        },
                      },
                      innerInput: {
                        color: '#c1c2c5',
                      },
                      error: {
                        color: '#fff',
                        background: 'rgba(255, 0, 0, 0.3)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        marginTop: 4,
                      },
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <Button
                    fullWidth
                    size="lg"
                    type="submit"
                    loading={loading}
                    leftSection={<IconLogin size={20} color="#c1c2c5" />}
                    styles={{
                      root: {
                        background:
                          'linear-gradient(135deg, rgba(102,126,234,0.4), rgba(118,75,162,0.3))',
                        border: '1px solid rgba(102, 126, 234, 0.5)',
                        color: '#c1c2c5',
                        fontWeight: 600,
                        fontSize: 16,
                        height: 50,
                        marginTop: 16,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, rgba(102,126,234,0.5), rgba(118,75,162,0.4))',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                  >
                    Giriş Yap
                  </Button>
                </motion.div>
              </Stack>
            </form>
          </Paper>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Text
            size="sm"
            ta="center"
            mt="xl"
            style={{
              color: 'rgba(144, 146, 150, 0.7)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            © 2025 Dans Okulu Yönetim Sistemi
          </Text>
        </motion.div>
      </Container>
    </Box>
  );
}
