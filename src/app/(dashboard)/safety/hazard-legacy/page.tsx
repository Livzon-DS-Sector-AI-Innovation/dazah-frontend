"use client"

'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Tag,
  Card,
  Row,
  Col,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useSafetyStore } from '@/stores/safety'
import {
  getHazards,
  createHazard,
  updateHazard,
  startRectification,
  completeRectification,
  verifyRectification,
  deleteHazard,
} from '@/actions/safety'
import type {
  HazardReport,
  HazardReportFormData,
  HazardType,
  HazardLevel,
} from '@/types/safety'
import {
  HAZARD_TYPE_OPTIONS,
  HAZARD_LEVEL_OPTIONS,
  HAZARD_STATUS_OPTIONS,
  RECTIFICATION_STATUS_OPTIONS,
} from '@/types/safety'
import dayjs from 'dayjs'

const { Text } = Typography